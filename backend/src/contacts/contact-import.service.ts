import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { CONTACT_IMPORT_QUEUE } from '../queues/queues.constants';

@Injectable()
export class ContactImportService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue(CONTACT_IMPORT_QUEUE) private importQueue: Queue,
  ) {}

  async previewImport(workspaceId: string, buffer: Buffer) {
    const rows = this.parseCsv(buffer);

    const candidates: Array<{ phone: string; name?: string; email?: string }> =
      [];
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
        source: 'import_csv',
      })),
      skipDuplicates: true,
    });
  }

  private isValidE164(phone: string): boolean {
    return /^\+[1-9]\d{7,14}$/.test(phone);
  }

  private parseCsv(buffer: Buffer): Array<Record<string, string>> {
    const text = buffer
      .toString('utf-8')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n');
    const lines = text.split('\n').filter((l) => l.trim());
    if (lines.length < 2) return [];

    const delimiter = lines[0].includes(';') ? ';' : ',';
    const headers = this.splitCsvLine(lines[0], delimiter).map((h) =>
      h
        .trim()
        .toLowerCase()
        .replace(/^["']|["']$/g, ''),
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
