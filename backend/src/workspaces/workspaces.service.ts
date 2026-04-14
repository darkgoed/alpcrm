import {
  BadRequestException,
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateWorkspaceSettingsDto } from './dto/workspace-settings.dto';
import {
  CreateFollowUpRuleDto,
  UpdateFollowUpRuleDto,
} from './dto/follow-up-rule.dto';
import {
  CreateWhatsappAccountDto,
  TestWhatsappConnectionDto,
  UpdateWhatsappAccountDto,
} from './dto/whatsapp-account.dto';

@Injectable()
export class WorkspacesService {
  constructor(private prisma: PrismaService) {}

  private hasOwn(dto: object, key: string): boolean {
    return Object.hasOwn(dto, key);
  }

  // ─── Configurações do workspace ──────────────────────────────────────────────

  async getSettings(workspaceId: string) {
    const settings = await this.prisma.workspaceSettings.findUnique({
      where: { workspaceId },
    });
    return settings ?? { workspaceId, autoCloseHours: null };
  }

  async updateSettings(workspaceId: string, dto: UpdateWorkspaceSettingsDto) {
    const data = {
      ...(this.hasOwn(dto, 'autoCloseHours')
        ? { autoCloseHours: dto.autoCloseHours ?? null }
        : {}),
      ...(this.hasOwn(dto, 'timezone') ? { timezone: dto.timezone } : {}),
      ...(this.hasOwn(dto, 'language') ? { language: dto.language } : {}),
      ...(this.hasOwn(dto, 'logoUrl') ? { logoUrl: dto.logoUrl ?? null } : {}),
      ...(this.hasOwn(dto, 'businessHours')
        ? {
            businessHours:
              dto.businessHours === null ? Prisma.JsonNull : dto.businessHours,
          }
        : {}),
      ...(this.hasOwn(dto, 'outOfHoursMessage')
        ? { outOfHoursMessage: dto.outOfHoursMessage ?? null }
        : {}),
    };

    return this.prisma.workspaceSettings.upsert({
      where: { workspaceId },
      create: { workspaceId, ...data },
      update: data,
    });
  }

  // ─── Regras de follow-up ─────────────────────────────────────────────────────

  async listFollowUpRules(workspaceId: string) {
    return this.prisma.followUpRule.findMany({
      where: { workspaceId },
      orderBy: { delayHours: 'asc' },
    });
  }

  async createFollowUpRule(workspaceId: string, dto: CreateFollowUpRuleDto) {
    return this.prisma.followUpRule.create({
      data: { workspaceId, ...dto },
    });
  }

  async updateFollowUpRule(
    workspaceId: string,
    id: string,
    dto: UpdateFollowUpRuleDto,
  ) {
    const rule = await this.prisma.followUpRule.findFirst({
      where: { id, workspaceId },
    });
    if (!rule) throw new NotFoundException('Regra não encontrada');

    return this.prisma.followUpRule.update({ where: { id }, data: dto });
  }

  async deleteFollowUpRule(workspaceId: string, id: string) {
    const rule = await this.prisma.followUpRule.findFirst({
      where: { id, workspaceId },
    });
    if (!rule) throw new NotFoundException('Regra não encontrada');

    await this.prisma.followUpRule.delete({ where: { id } });
  }

  // ─── Contas WhatsApp ─────────────────────────────────────────────────────────

  async listWhatsappAccounts(workspaceId: string) {
    return this.prisma.whatsappAccount.findMany({
      where: { workspaceId },
      orderBy: { phoneNumber: 'asc' },
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        metaAccountId: true,
        wabaId: true,
        verifyToken: true,
        isActive: true,
        // token e appSecret não são retornados por padrão (sensíveis)
      },
    });
  }

  async createWhatsappAccount(
    workspaceId: string,
    dto: CreateWhatsappAccountDto,
  ) {
    const existing = await this.prisma.whatsappAccount.findFirst({
      where: { workspaceId, phoneNumber: dto.phoneNumber },
    });
    if (existing)
      throw new ConflictException(
        'Já existe uma conta com esse número neste workspace',
      );

    return this.prisma.whatsappAccount.create({
      data: { workspaceId, ...dto },
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        metaAccountId: true,
        wabaId: true,
        verifyToken: true,
        isActive: true,
      },
    });
  }

  async testWhatsappConnection(
    workspaceId: string,
    dto: TestWhatsappConnectionDto,
  ) {
    void workspaceId;

    const url = new URL(
      `https://graph.facebook.com/v19.0/${dto.phoneNumberId}`,
    );
    url.searchParams.set('fields', 'id,display_phone_number,verified_name');

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${dto.token}`,
      },
    });

    const raw = await response.text();
    const payload = raw ? this.tryParseJson(raw) : null;
    const payloadRecord = this.isRecord(payload) ? payload : null;
    const errorPayload =
      payloadRecord && this.isRecord(payloadRecord.error)
        ? payloadRecord.error
        : null;

    if (!response.ok) {
      const message =
        this.getString(errorPayload?.error_user_msg) ||
        this.getString(errorPayload?.message) ||
        'Falha ao validar a conta no WhatsApp Cloud API';

      throw new BadRequestException(message);
    }

    return {
      id: this.getString(payloadRecord?.id),
      display_phone_number: this.getString(payloadRecord?.display_phone_number)
        ?? '',
      verified_name: this.getString(payloadRecord?.verified_name) ?? '',
    };
  }

  async updateWhatsappAccount(
    workspaceId: string,
    id: string,
    dto: UpdateWhatsappAccountDto,
  ) {
    const account = await this.prisma.whatsappAccount.findFirst({
      where: { id, workspaceId },
    });
    if (!account) throw new NotFoundException('Conta WhatsApp não encontrada');

    return this.prisma.whatsappAccount.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        metaAccountId: true,
        wabaId: true,
        verifyToken: true,
        isActive: true,
      },
    });
  }

  async deleteWhatsappAccount(workspaceId: string, id: string) {
    const account = await this.prisma.whatsappAccount.findFirst({
      where: { id, workspaceId },
    });
    if (!account) throw new NotFoundException('Conta WhatsApp não encontrada');

    await this.prisma.whatsappAccount.delete({ where: { id } });
  }

  // ─── Audit Logs ───────────────────────────────────────────────────────────────

  async listAuditLogs(
    workspaceId: string,
    filters: {
      entity?: string;
      userId?: string;
      from?: Date;
      to?: Date;
      take?: number;
      cursor?: string;
    },
  ) {
    const { entity, userId, from, to, take = 50, cursor } = filters;

    return this.prisma.auditLog.findMany({
      where: {
        workspaceId,
        ...(entity ? { entity } : {}),
        ...(userId ? { userId } : {}),
        ...(from || to
          ? {
              createdAt: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {}),
              },
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  private tryParseJson(raw: string): unknown {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private getString(value: unknown): string | null {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    return null;
  }
}
