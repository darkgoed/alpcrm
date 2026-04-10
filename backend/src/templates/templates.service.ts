import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { TEMPLATE_POLL_QUEUE } from '../queues/queues.constants';

const META_API = 'https://graph.facebook.com/v18.0';

// ─── Tipos da API da Meta ────────────────────────────────────────────────────

interface MetaTemplateResponse {
  id: string;
  status: string;
}

interface MetaTemplateListItem {
  id: string;
  name: string;
  status: string;
  rejected_reason?: string;
}

@Injectable()
export class TemplatesService implements OnModuleInit {
  private readonly logger = new Logger(TemplatesService.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue(TEMPLATE_POLL_QUEUE) private pollQueue: Queue,
  ) {}

  // ─── Registra job de polling repetível ao iniciar ────────────────────────────

  async onModuleInit() {
    await this.pollQueue.add(
      'poll-templates',
      {},
      {
        jobId: 'poll-templates-recurring',
        repeat: { every: 60 * 60 * 1000 },
      },
    );
    this.logger.log('[Templates] Job de polling registrado (1h)');
  }

  // ─── Listar templates do workspace ───────────────────────────────────────────

  async list(workspaceId: string) {
    return this.prisma.messageTemplate.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        category: true,
        language: true,
        body: true,
        status: true,
        metaId: true,
        rejectedReason: true,
        createdAt: true,
        updatedAt: true,
        whatsappAccount: { select: { id: true, name: true, phoneNumber: true } },
      },
    });
  }

  // ─── Criar template e enviar para Meta ───────────────────────────────────────

  async create(workspaceId: string, dto: CreateTemplateDto) {
    const account = await this.prisma.whatsappAccount.findFirst({
      where: { id: dto.whatsappAccountId, workspaceId },
    });
    if (!account) throw new NotFoundException('Conta WhatsApp não encontrada');
    if (!account.wabaId) throw new BadRequestException('Conta não tem WABA ID configurado');

    const exists = await this.prisma.messageTemplate.findFirst({
      where: { workspaceId, name: dto.name, language: dto.language },
    });
    if (exists) throw new ConflictException('Template com esse nome e idioma já existe');

    let metaId: string | null = null;
    let initialStatus: 'PENDING' | 'APPROVED' | 'REJECTED' = 'PENDING';

    try {
      const res = await fetch(`${META_API}/${account.wabaId}/message_templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${account.token}`,
        },
        body: JSON.stringify({
          name: dto.name,
          category: dto.category,
          language: dto.language,
          components: [{ type: 'BODY', text: dto.body }],
        }),
      });
      const data = (await res.json()) as MetaTemplateResponse & { error?: { message: string } };
      if (!res.ok) throw new Error(data?.error?.message ?? 'Erro na API Meta');
      metaId = data.id;
      initialStatus = this.parseStatus(data.status);
    } catch (err: any) {
      this.logger.error(`[Templates] Falha ao submeter: ${err?.message}`);
      throw new BadRequestException(err?.message ?? 'Erro ao enviar template para a Meta');
    }

    return this.prisma.messageTemplate.create({
      data: {
        workspaceId,
        whatsappAccountId: dto.whatsappAccountId,
        name: dto.name,
        category: dto.category,
        language: dto.language,
        body: dto.body,
        metaId,
        status: initialStatus,
      },
    });
  }

  // ─── Excluir template ────────────────────────────────────────────────────────

  async delete(workspaceId: string, id: string) {
    const template = await this.prisma.messageTemplate.findFirst({
      where: { id, workspaceId },
      include: { whatsappAccount: true },
    });
    if (!template) throw new NotFoundException('Template não encontrado');

    if (template.metaId && template.whatsappAccount.wabaId) {
      try {
        await fetch(
          `${META_API}/${template.whatsappAccount.wabaId}/message_templates?name=${encodeURIComponent(template.name)}`,
          {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${template.whatsappAccount.token}` },
          },
        );
      } catch {
        this.logger.warn(`[Templates] Não foi possível remover ${template.name} da Meta`);
      }
    }

    await this.prisma.messageTemplate.delete({ where: { id } });
  }

  // ─── Atualizar status de um template específico ──────────────────────────────

  async refreshOne(workspaceId: string, id: string) {
    const template = await this.prisma.messageTemplate.findFirst({
      where: { id, workspaceId },
      include: { whatsappAccount: true },
    });
    if (!template) throw new NotFoundException('Template não encontrado');

    await this.fetchAndUpdateStatus([template.id], template.whatsappAccount);

    return this.prisma.messageTemplate.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        name: true,
        category: true,
        language: true,
        body: true,
        status: true,
        metaId: true,
        rejectedReason: true,
        createdAt: true,
        updatedAt: true,
        whatsappAccount: { select: { id: true, name: true, phoneNumber: true } },
      },
    });
  }

  // ─── Job de polling: atualiza todos os PENDING ───────────────────────────────

  async pollAllPending() {
    const pending = await this.prisma.messageTemplate.findMany({
      where: { status: 'PENDING' },
      include: { whatsappAccount: true },
    });

    if (pending.length === 0) return;
    this.logger.log(`[Templates] Polling ${pending.length} template(s) PENDING`);

    const byAccount = new Map<string, typeof pending>();
    for (const t of pending) {
      const key = t.whatsappAccountId;
      if (!byAccount.has(key)) byAccount.set(key, []);
      byAccount.get(key)!.push(t);
    }

    for (const [, templates] of byAccount) {
      const ids = templates.map((t) => t.id);
      await this.fetchAndUpdateStatus(ids, templates[0].whatsappAccount);
    }
  }

  // ─── Busca status na Meta e atualiza no banco ────────────────────────────────

  private async fetchAndUpdateStatus(
    templateIds: string[],
    account: { wabaId: string; token: string },
  ) {
    if (!account.wabaId || !account.token) return;

    const templates = await this.prisma.messageTemplate.findMany({
      where: { id: { in: templateIds } },
    });

    for (const template of templates) {
      try {
        const res = await fetch(
          `${META_API}/${account.wabaId}/message_templates?name=${encodeURIComponent(template.name)}&fields=name,status,rejected_reason`,
          { headers: { Authorization: `Bearer ${account.token}` } },
        );
        const data = (await res.json()) as { data: MetaTemplateListItem[] };
        const found = data.data?.find((t) => t.name === template.name);
        if (!found) continue;

        const newStatus = this.parseStatus(found.status);
        if (newStatus !== template.status || found.rejected_reason !== template.rejectedReason) {
          await this.prisma.messageTemplate.update({
            where: { id: template.id },
            data: {
              status: newStatus,
              rejectedReason: found.rejected_reason ?? null,
              metaId: template.metaId ?? found.id,
            },
          });
          this.logger.log(`[Templates] ${template.name}: ${template.status} → ${newStatus}`);
        }
      } catch (err: any) {
        this.logger.warn(`[Templates] Erro ao buscar status de ${template.name}: ${err?.message}`);
      }
    }
  }

  // ─── Utilitário ──────────────────────────────────────────────────────────────

  private parseStatus(raw: string): 'PENDING' | 'APPROVED' | 'REJECTED' {
    if (raw === 'APPROVED') return 'APPROVED';
    if (raw === 'REJECTED') return 'REJECTED';
    return 'PENDING';
  }
}
