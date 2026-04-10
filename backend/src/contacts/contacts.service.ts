import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactDto, UpdateContactDto, ContactFilterDto } from './dto/contact.dto';
import { CONTACT_IMPORT_QUEUE } from '../queues/queues.constants';

@Injectable()
export class ContactsService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue(CONTACT_IMPORT_QUEUE) private importQueue: Queue,
  ) {}

  // ─── Listar contatos com filtros ─────────────────────────────────────────────

  async findAll(workspaceId: string, filters: ContactFilterDto) {
    const where: any = { workspaceId };

    if (filters.search) {
      const q = filters.search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (filters.tagId) {
      where.contactTags = { some: { tagId: filters.tagId } };
    }

    if (filters.stageId) {
      where.contactPipelines = { some: { stageId: filters.stageId } };
    } else if (filters.pipelineId) {
      where.contactPipelines = { some: { pipelineId: filters.pipelineId } };
    }

    return this.prisma.contact.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        contactTags: { include: { tag: true } },
        contactPipelines: { include: { stage: true, pipeline: true } },
        conversations: {
          where: { status: 'open' },
          select: { id: true, status: true },
          take: 1,
        },
      },
    });
  }

  // ─── Buscar um contato ────────────────────────────────────────────────────────

  async findOne(workspaceId: string, id: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, workspaceId },
      include: {
        contactTags: { include: { tag: true } },
        contactPipelines: { include: { stage: true, pipeline: true } },
        conversations: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, status: true, createdAt: true, lastMessageAt: true },
        },
      },
    });
    if (!contact) throw new NotFoundException('Contato não encontrado');
    return contact;
  }

  // ─── Criar contato ────────────────────────────────────────────────────────────

  async create(workspaceId: string, dto: CreateContactDto) {
    const existing = await this.prisma.contact.findUnique({
      where: { workspaceId_phone: { workspaceId, phone: dto.phone } },
    });
    if (existing) throw new ConflictException('Contato com esse telefone já existe');

    const { tagIds, ...rest } = dto;

    return this.prisma.contact.create({
      data: {
        workspaceId,
        ...rest,
        ...(tagIds?.length
          ? { contactTags: { create: tagIds.map((tagId) => ({ tagId })) } }
          : {}),
      },
      include: {
        contactTags: { include: { tag: true } },
      },
    });
  }

  // ─── Atualizar contato ────────────────────────────────────────────────────────

  async update(workspaceId: string, id: string, dto: UpdateContactDto) {
    const contact = await this.prisma.contact.findFirst({ where: { id, workspaceId } });
    if (!contact) throw new NotFoundException('Contato não encontrado');

    return this.prisma.contact.update({ where: { id }, data: dto });
  }

  // ─── Excluir contato ──────────────────────────────────────────────────────────

  async remove(workspaceId: string, id: string) {
    const contact = await this.prisma.contact.findFirst({ where: { id, workspaceId } });
    if (!contact) throw new NotFoundException('Contato não encontrado');

    await this.prisma.contact.delete({ where: { id } });
  }

  // ─── Tags ─────────────────────────────────────────────────────────────────────

  async addTag(workspaceId: string, contactId: string, tagId: string) {
    const contact = await this.prisma.contact.findFirst({ where: { id: contactId, workspaceId } });
    if (!contact) throw new NotFoundException('Contato não encontrado');

    const tag = await this.prisma.tag.findFirst({ where: { id: tagId, workspaceId } });
    if (!tag) throw new NotFoundException('Tag não encontrada');

    await this.prisma.contactTag.upsert({
      where: { contactId_tagId: { contactId, tagId } },
      create: { contactId, tagId },
      update: {},
    });
  }

  async removeTag(workspaceId: string, contactId: string, tagId: string) {
    const contact = await this.prisma.contact.findFirst({ where: { id: contactId, workspaceId } });
    if (!contact) throw new NotFoundException('Contato não encontrado');

    await this.prisma.contactTag.deleteMany({ where: { contactId, tagId } });
  }

  // ─── CRUD de Tags do workspace ────────────────────────────────────────────────

  async listTags(workspaceId: string) {
    return this.prisma.tag.findMany({ where: { workspaceId }, orderBy: { name: 'asc' } });
  }

  async createTag(workspaceId: string, name: string, color?: string) {
    const existing = await this.prisma.tag.findUnique({ where: { workspaceId_name: { workspaceId, name } } });
    if (existing) throw new ConflictException('Tag com esse nome já existe');

    return this.prisma.tag.create({ data: { workspaceId, name, color: color ?? '#6366f1' } });
  }

  async deleteTag(workspaceId: string, id: string) {
    const tag = await this.prisma.tag.findFirst({ where: { id, workspaceId } });
    if (!tag) throw new NotFoundException('Tag não encontrada');
    await this.prisma.tag.delete({ where: { id } });
  }

  // ─── Importação CSV ───────────────────────────────────────────────────────────

  async previewImport(workspaceId: string, buffer: Buffer) {
    const rows = this.parseCsv(buffer);

    const candidates: Array<{ phone: string; name?: string; email?: string }> = [];
    const invalid: Array<{ row: number; phone: string; reason: string }> = [];

    rows.forEach((row, i) => {
      const phone = row['phone']?.trim() ?? '';
      if (!phone) {
        invalid.push({ row: i + 2, phone: '', reason: 'Telefone obrigatório' });
        return;
      }
      if (!this.isValidE164(phone)) {
        invalid.push({
          row: i + 2,
          phone,
          reason: 'Formato inválido — use E.164 (ex: +5511999999999)',
        });
        return;
      }
      candidates.push({
        phone,
        name: row['name'] || undefined,
        email: row['email'] || undefined,
      });
    });

    // Detectar duplicados no banco
    const phones = candidates.map((c) => c.phone);
    const existing = await this.prisma.contact.findMany({
      where: { workspaceId, phone: { in: phones } },
      select: { phone: true },
    });
    const existingSet = new Set(existing.map((c) => c.phone));

    const duplicates: string[] = [];
    const toCreate = candidates.filter((c) => {
      if (existingSet.has(c.phone)) {
        duplicates.push(c.phone);
        return false;
      }
      return true;
    });

    return { toCreate, duplicates, invalid, totalRows: rows.length };
  }

  async queueImport(
    workspaceId: string,
    rows: Array<{ phone: string; name?: string; email?: string }>,
  ) {
    const job = await this.importQueue.add('import', { workspaceId, rows });
    return { jobId: job.id, count: rows.length };
  }

  async bulkCreate(
    workspaceId: string,
    rows: Array<{ phone: string; name?: string; email?: string }>,
  ) {
    await this.prisma.contact.createMany({
      data: rows.map((r) => ({
        workspaceId,
        phone: r.phone,
        name: r.name ?? null,
        email: r.email ?? null,
      })),
      skipDuplicates: true,
    });
  }

  // ─── Helpers CSV ──────────────────────────────────────────────────────────────

  private isValidE164(phone: string): boolean {
    return /^\+[1-9]\d{7,14}$/.test(phone);
  }

  private parseCsv(buffer: Buffer): Array<Record<string, string>> {
    const text = buffer.toString('utf-8').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = text.split('\n').filter((l) => l.trim());
    if (lines.length < 2) return [];

    const delimiter = lines[0].includes(';') ? ';' : ',';
    const headers = this.splitCsvLine(lines[0], delimiter).map((h) =>
      h.trim().toLowerCase().replace(/^["']|["']$/g, ''),
    );

    return lines.slice(1).map((line) => {
      const values = this.splitCsvLine(line, delimiter);
      const row: Record<string, string> = {};
      headers.forEach((h, i) => {
        row[h] = (values[i] ?? '').trim().replace(/^["']|["']$/g, '');
      });
      return row;
    });
  }

  private splitCsvLine(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  }
}
