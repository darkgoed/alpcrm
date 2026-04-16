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
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
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
  language?: string;
  status: string;
  rejected_reason?: string;
}

interface MetaTemplateListResponse {
  data?: MetaTemplateListItem[];
  paging?: {
    next?: string;
  };
}

type TemplateListSelect = {
  id: true;
  name: true;
  category: true;
  language: true;
  headerFormat: true;
  headerText: true;
  headerMediaHandle: true;
  body: true;
  footerText: true;
  buttons: true;
  variableExamples: true;
  status: true;
  metaId: true;
  rejectedReason: true;
  createdAt: true;
  updatedAt: true;
  whatsappAccount: {
    select: { id: true; name: true; phoneNumber: true };
  };
};

const templateListSelect: TemplateListSelect = {
  id: true,
  name: true,
  category: true,
  language: true,
  headerFormat: true,
  headerText: true,
  headerMediaHandle: true,
  body: true,
  footerText: true,
  buttons: true,
  variableExamples: true,
  status: true,
  metaId: true,
  rejectedReason: true,
  createdAt: true,
  updatedAt: true,
  whatsappAccount: {
    select: { id: true, name: true, phoneNumber: true },
  },
};

@Injectable()
export class TemplatesService implements OnModuleInit {
  private readonly logger = new Logger(TemplatesService.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue(TEMPLATE_POLL_QUEUE) private pollQueue: Queue,
    private audit: AuditService,
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
      select: templateListSelect,
    });
  }

  // ─── Criar template e enviar para Meta ───────────────────────────────────────

  async create(workspaceId: string, dto: CreateTemplateDto, actorId?: string) {
    const account = await this.prisma.whatsappAccount.findFirst({
      where: { id: dto.whatsappAccountId, workspaceId },
    });
    if (!account) throw new NotFoundException('Conta WhatsApp não encontrada');
    if (!account.wabaId)
      throw new BadRequestException('Conta não tem WABA ID configurado');

    const exists = await this.prisma.messageTemplate.findFirst({
      where: { workspaceId, name: dto.name, language: dto.language },
    });
    if (exists)
      throw new ConflictException('Template com esse nome e idioma já existe');
    this.validateDto(dto);

    let metaId: string | null = null;
    let initialStatus: 'PENDING' | 'APPROVED' | 'REJECTED' = 'PENDING';

    try {
      const res = await fetch(
        `${META_API}/${account.wabaId}/message_templates`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${account.token}`,
          },
          body: JSON.stringify({
            name: dto.name,
            category: dto.category,
            language: dto.language,
            components: this.buildMetaTemplateComponents(dto),
          }),
        },
      );
      const data = (await res.json()) as MetaTemplateResponse & {
        error?: { message: string };
      };
      if (!res.ok) throw new Error(data?.error?.message ?? 'Erro na API Meta');
      metaId = data.id;
      initialStatus = this.parseStatus(data.status);
    } catch (err: unknown) {
      const errorMessage = this.getErrorMessage(err);
      this.logger.error(`[Templates] Falha ao submeter: ${errorMessage}`);
      throw new BadRequestException(
        errorMessage || 'Erro ao enviar template para a Meta',
      );
    }

    const template = await this.prisma.messageTemplate.create({
      data: {
        workspaceId,
        whatsappAccountId: dto.whatsappAccountId,
        name: dto.name,
        category: dto.category,
        language: dto.language,
        headerFormat: dto.headerFormat ?? null,
        headerText: dto.headerText ?? null,
        headerMediaHandle: dto.headerMediaHandle ?? null,
        body: dto.body,
        footerText: dto.footerText ?? null,
        buttons: dto.buttons
          ? (JSON.parse(JSON.stringify(dto.buttons)) as Prisma.InputJsonValue)
          : undefined,
        variableExamples: dto.variableExamples
          ? (JSON.parse(
              JSON.stringify(dto.variableExamples),
            ) as Prisma.InputJsonValue)
          : undefined,
        metaId,
        status: initialStatus,
      },
    });
    this.audit.log({
      workspaceId,
      userId: actorId,
      action: 'create',
      entity: 'template',
      entityId: template.id,
      metadata: { name: dto.name, category: dto.category },
    });
    return template;
  }

  // ─── Excluir template ────────────────────────────────────────────────────────

  async delete(workspaceId: string, id: string, actorId?: string) {
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
            headers: {
              Authorization: `Bearer ${template.whatsappAccount.token}`,
            },
          },
        );
      } catch {
        this.logger.warn(
          `[Templates] Não foi possível remover ${template.name} da Meta`,
        );
      }
    }

    await this.prisma.messageTemplate.delete({ where: { id } });
    this.audit.log({
      workspaceId,
      userId: actorId,
      action: 'delete',
      entity: 'template',
      entityId: id,
      metadata: { name: template.name },
    });
  }

  // ─── Atualizar status de um template específico ──────────────────────────────

  async refreshOne(workspaceId: string, id: string) {
    const template = await this.prisma.messageTemplate.findFirst({
      where: { id, workspaceId },
      include: { whatsappAccount: true },
    });
    if (!template) throw new NotFoundException('Template não encontrado');

    await this.syncAccountTemplates(
      template.whatsappAccountId,
      workspaceId,
      id,
    );

    return this.prisma.messageTemplate.findUniqueOrThrow({
      where: { id },
      select: templateListSelect,
    });
  }

  // ─── Job de polling: atualiza todos os PENDING ───────────────────────────────

  async pollAllPending() {
    const trackedTemplates = await this.prisma.messageTemplate.findMany({
      where: {
        status: { in: ['PENDING', 'APPROVED'] },
      },
      select: {
        id: true,
        workspaceId: true,
        whatsappAccountId: true,
      },
    });

    if (trackedTemplates.length === 0) return;
    this.logger.log(
      `[Templates] Polling ${trackedTemplates.length} template(s) rastreados`,
    );

    const byAccount = new Map<
      string,
      { workspaceId: string; whatsappAccountId: string }
    >();

    for (const template of trackedTemplates) {
      const key = `${template.workspaceId}:${template.whatsappAccountId}`;
      if (!byAccount.has(key)) {
        byAccount.set(key, {
          workspaceId: template.workspaceId,
          whatsappAccountId: template.whatsappAccountId,
        });
      }
    }

    for (const account of byAccount.values()) {
      await this.syncAccountTemplates(
        account.whatsappAccountId,
        account.workspaceId,
      );
    }
  }

  // ─── Busca status na Meta e atualiza no banco ────────────────────────────────

  private async syncAccountTemplates(
    whatsappAccountId: string,
    workspaceId: string,
    templateId?: string,
  ) {
    const account = await this.prisma.whatsappAccount.findFirst({
      where: { id: whatsappAccountId, workspaceId },
      select: { id: true, wabaId: true, token: true },
    });

    if (!account) return;
    if (!account.wabaId || !account.token) return;

    const templates = await this.prisma.messageTemplate.findMany({
      where: {
        workspaceId,
        whatsappAccountId,
        ...(templateId
          ? { id: templateId }
          : { status: { in: ['PENDING', 'APPROVED'] } }),
      },
    });
    if (templates.length === 0) return;

    const metaTemplates = await this.fetchMetaTemplates(
      account.wabaId,
      account.token,
    );
    if (metaTemplates.length === 0) return;

    const byMetaId = new Map(
      metaTemplates.map((template) => [template.id, template]),
    );
    const byNameAndLanguage = new Map(
      metaTemplates.map((template) => [
        `${template.name}:${template.language ?? ''}`,
        template,
      ]),
    );

    for (const template of templates) {
      try {
        const found =
          (template.metaId ? byMetaId.get(template.metaId) : undefined) ??
          byNameAndLanguage.get(`${template.name}:${template.language}`);

        if (!found) {
          this.logger.warn(
            `[Templates] Template ${template.name} não foi encontrado na Meta durante a sincronização`,
          );
          continue;
        }

        const newStatus = this.parseStatus(found.status);
        if (
          newStatus !== template.status ||
          (found.rejected_reason ?? null) !== template.rejectedReason ||
          (!template.metaId && found.id)
        ) {
          await this.prisma.messageTemplate.update({
            where: { id: template.id },
            data: {
              status: newStatus,
              rejectedReason: found.rejected_reason ?? null,
              metaId: template.metaId ?? found.id,
            },
          });
          this.logger.log(
            `[Templates] ${template.name}: ${template.status} → ${newStatus}`,
          );
        }
      } catch (err: unknown) {
        this.logger.warn(
          `[Templates] Erro ao buscar status de ${template.name}: ${this.getErrorMessage(err)}`,
        );
      }
    }
  }

  private async fetchMetaTemplates(wabaId: string, token: string) {
    const templates: MetaTemplateListItem[] = [];
    let nextUrl: string | null =
      `${META_API}/${wabaId}/message_templates?limit=100&fields=id,name,language,status,rejected_reason`;

    while (nextUrl) {
      const res = await fetch(nextUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as MetaTemplateListResponse & {
        error?: { message?: string };
      };

      if (!res.ok) {
        throw new Error(
          data.error?.message ?? 'Erro ao consultar templates na Meta',
        );
      }

      templates.push(...(data.data ?? []));
      nextUrl = data.paging?.next ?? null;
    }

    return templates;
  }

  // ─── Utilitário ──────────────────────────────────────────────────────────────

  private parseStatus(raw: string): 'PENDING' | 'APPROVED' | 'REJECTED' {
    if (raw === 'APPROVED') return 'APPROVED';
    if (raw === 'REJECTED') return 'REJECTED';
    return 'PENDING';
  }

  private getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : 'Erro desconhecido';
  }

  private validateDto(dto: CreateTemplateDto) {
    if (dto.headerFormat === 'TEXT' && !dto.headerText) {
      throw new BadRequestException('Header textual exige o campo headerText');
    }

    if (
      dto.headerFormat &&
      dto.headerFormat !== 'TEXT' &&
      !dto.headerMediaHandle
    ) {
      throw new BadRequestException(
        'Header de mídia exige o campo headerMediaHandle',
      );
    }

    if (!dto.headerFormat && (dto.headerText || dto.headerMediaHandle)) {
      throw new BadRequestException(
        'Defina headerFormat ao enviar dados de header',
      );
    }

    for (const button of dto.buttons ?? []) {
      if (button.type === 'URL' && !button.url) {
        throw new BadRequestException('Botão URL exige o campo url');
      }

      if (button.type === 'PHONE_NUMBER' && !button.phoneNumber) {
        throw new BadRequestException(
          'Botão PHONE_NUMBER exige o campo phoneNumber',
        );
      }
    }
  }

  private buildMetaTemplateComponents(dto: CreateTemplateDto) {
    const components: Record<string, unknown>[] = [];

    if (dto.headerFormat === 'TEXT' && dto.headerText) {
      const headerComponent: Record<string, unknown> = {
        type: 'HEADER',
        format: 'TEXT',
        text: dto.headerText,
      };

      if (dto.variableExamples?.headerText?.length) {
        headerComponent.example = {
          header_text: dto.variableExamples.headerText,
        };
      }

      components.push(headerComponent);
    }

    if (
      dto.headerFormat &&
      dto.headerFormat !== 'TEXT' &&
      dto.headerMediaHandle
    ) {
      components.push({
        type: 'HEADER',
        format: dto.headerFormat,
        example: {
          header_handle: [dto.headerMediaHandle],
        },
      });
    }

    const bodyComponent: Record<string, unknown> = {
      type: 'BODY',
      text: dto.body,
    };

    if (dto.variableExamples?.bodyText?.length) {
      bodyComponent.example = {
        body_text: [dto.variableExamples.bodyText],
      };
    }

    components.push(bodyComponent);

    if (dto.footerText) {
      components.push({
        type: 'FOOTER',
        text: dto.footerText,
      });
    }

    if (dto.buttons?.length) {
      components.push({
        type: 'BUTTONS',
        buttons: dto.buttons.map((button, index) => {
          if (button.type === 'URL') {
            const metaButton: Record<string, unknown> = {
              type: 'URL',
              text: button.text,
              url: button.url,
            };

            if (dto.variableExamples?.buttonText?.[index]) {
              metaButton.example = [dto.variableExamples.buttonText[index]];
            }

            return metaButton;
          }

          if (button.type === 'PHONE_NUMBER') {
            return {
              type: 'PHONE_NUMBER',
              text: button.text,
              phone_number: button.phoneNumber,
            };
          }

          return {
            type: 'QUICK_REPLY',
            text: button.text,
          };
        }),
      });
    }

    return components;
  }
}
