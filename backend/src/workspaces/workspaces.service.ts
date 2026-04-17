import {
  BadRequestException,
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EncryptionService } from '../common/services/encryption.service';
import { MailService } from '../common/services/mail.service';
import {
  TestWorkspaceSmtpDto,
  UpdateWorkspaceSettingsDto,
} from './dto/workspace-settings.dto';
import {
  CreateFollowUpRuleDto,
  UpdateFollowUpRuleDto,
} from './dto/follow-up-rule.dto';
import {
  CreateWhatsappAccountDto,
  RotateWhatsappCredentialsDto,
  TestWhatsappConnectionDto,
  UpdateWhatsappAccountDto,
} from './dto/whatsapp-account.dto';

@Injectable()
export class WorkspacesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private encryption: EncryptionService,
    private mail: MailService,
  ) {}

  private hasOwn(dto: object, key: string): boolean {
    return Object.hasOwn(dto, key);
  }

  // ─── Configurações do workspace ──────────────────────────────────────────────

  async getSettings(workspaceId: string) {
    const settings = await this.prisma.workspaceSettings.findUnique({
      where: { workspaceId },
    });
    return this.serializeSettings(
      settings ?? {
        workspaceId,
        autoCloseHours: null,
        timezone: 'America/Sao_Paulo',
        language: 'pt_BR',
        logoUrl: null,
        businessHours: null,
        outOfHoursMessage: null,
        smtpHost: null,
        smtpPort: null,
        smtpSecure: false,
        smtpUser: null,
        smtpPass: null,
        smtpFromName: null,
        smtpFromEmail: null,
      },
    );
  }

  async updateSettings(
    workspaceId: string,
    dto: UpdateWorkspaceSettingsDto,
    actorId?: string,
  ) {
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
      ...(this.hasOwn(dto, 'smtpHost')
        ? { smtpHost: dto.smtpHost?.trim() || null }
        : {}),
      ...(this.hasOwn(dto, 'smtpPort')
        ? { smtpPort: dto.smtpPort ?? null }
        : {}),
      ...(this.hasOwn(dto, 'smtpSecure')
        ? { smtpSecure: Boolean(dto.smtpSecure) }
        : {}),
      ...(this.hasOwn(dto, 'smtpUser')
        ? { smtpUser: dto.smtpUser?.trim() || null }
        : {}),
      ...(this.hasOwn(dto, 'smtpPassword')
        ? {
            smtpPass: dto.smtpPassword?.trim()
              ? this.encryption.encrypt(dto.smtpPassword.trim())
              : null,
          }
        : {}),
      ...(this.hasOwn(dto, 'smtpFromName')
        ? { smtpFromName: dto.smtpFromName?.trim() || null }
        : {}),
      ...(this.hasOwn(dto, 'smtpFromEmail')
        ? { smtpFromEmail: dto.smtpFromEmail?.trim() || null }
        : {}),
    };

    const result = await this.prisma.workspaceSettings.upsert({
      where: { workspaceId },
      create: { workspaceId, ...data },
      update: data,
    });
    this.audit.log({
      workspaceId,
      userId: actorId,
      action: 'update_settings',
      entity: 'workspace',
      entityId: workspaceId,
      metadata: { fields: Object.keys(dto) },
    });
    return this.serializeSettings(result);
  }

  async testSmtpConnection(workspaceId: string, dto: TestWorkspaceSmtpDto) {
    const current = await this.prisma.workspaceSettings.findUnique({
      where: { workspaceId },
      select: {
        smtpHost: true,
        smtpPort: true,
        smtpSecure: true,
        smtpUser: true,
        smtpPass: true,
        smtpFromName: true,
        smtpFromEmail: true,
      },
    });

    const config = this.mail.normalizeConfig({
      host: dto.smtpHost ?? current?.smtpHost ?? null,
      port: dto.smtpPort ?? current?.smtpPort ?? null,
      secure: dto.smtpSecure ?? current?.smtpSecure ?? false,
      user: dto.smtpUser ?? current?.smtpUser ?? null,
      pass:
        dto.smtpPassword !== undefined
          ? dto.smtpPassword
          : current?.smtpPass
            ? this.encryption.decrypt(current.smtpPass)
            : null,
      fromName: dto.smtpFromName ?? current?.smtpFromName ?? null,
      fromEmail: dto.smtpFromEmail ?? current?.smtpFromEmail ?? null,
    });

    return this.mail.verifyWorkspaceSmtpConfig(config);
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
      data: {
        workspaceId,
        ...dto,
        token: this.encryption.encrypt(dto.token),
        appSecret: dto.appSecret ? this.encryption.encrypt(dto.appSecret) : '',
      },
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
      display_phone_number:
        this.getString(payloadRecord?.display_phone_number) ?? '',
      verified_name: this.getString(payloadRecord?.verified_name) ?? '',
    };
  }

  async updateWhatsappAccount(
    workspaceId: string,
    id: string,
    dto: UpdateWhatsappAccountDto,
    actorId?: string,
  ) {
    const account = await this.prisma.whatsappAccount.findFirst({
      where: { id, workspaceId },
    });
    if (!account) throw new NotFoundException('Conta WhatsApp não encontrada');

    const encryptedData = {
      ...dto,
      ...(dto.token !== undefined
        ? { token: this.encryption.encrypt(dto.token) }
        : {}),
      ...(dto.appSecret !== undefined
        ? {
            appSecret: dto.appSecret
              ? this.encryption.encrypt(dto.appSecret)
              : '',
          }
        : {}),
    };

    const updated = await this.prisma.whatsappAccount.update({
      where: { id },
      data: encryptedData,
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

    const rotatedFields = (
      ['token', 'appSecret', 'verifyToken'] as const
    ).filter((field) => dto[field] !== undefined);

    if (rotatedFields.length > 0) {
      this.audit.log({
        workspaceId,
        userId: actorId,
        action: 'rotate_credentials',
        entity: 'whatsapp_account',
        entityId: id,
        metadata: { fields: rotatedFields },
      });
    }

    return updated;
  }

  async rotateWhatsappCredentials(
    workspaceId: string,
    id: string,
    dto: RotateWhatsappCredentialsDto,
    actorId?: string,
  ) {
    const account = await this.prisma.whatsappAccount.findFirst({
      where: { id, workspaceId },
    });
    if (!account) throw new NotFoundException('Conta WhatsApp não encontrada');

    // Validar o novo token contra a Meta antes de persistir
    await this.testWhatsappConnection(workspaceId, {
      phoneNumberId: account.metaAccountId,
      token: dto.token,
    });

    const data: Record<string, unknown> = {
      token: this.encryption.encrypt(dto.token),
    };
    if (dto.appSecret !== undefined) {
      data.appSecret = dto.appSecret
        ? this.encryption.encrypt(dto.appSecret)
        : '';
    }
    if (dto.verifyToken !== undefined) {
      data.verifyToken = dto.verifyToken;
    }

    const updated = await this.prisma.whatsappAccount.update({
      where: { id },
      data,
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

    const fields = Object.keys(data);
    this.audit.log({
      workspaceId,
      userId: actorId,
      action: 'rotate_credentials',
      entity: 'whatsapp_account',
      entityId: id,
      metadata: { fields, validated: true },
    });

    return updated;
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

  private serializeSettings(settings: {
    workspaceId: string;
    autoCloseHours: number | null;
    timezone: string;
    language: string;
    logoUrl: string | null;
    businessHours: Prisma.JsonValue | null;
    outOfHoursMessage: string | null;
    smtpHost: string | null;
    smtpPort: number | null;
    smtpSecure: boolean;
    smtpUser: string | null;
    smtpPass: string | null;
    smtpFromName: string | null;
    smtpFromEmail: string | null;
  }) {
    return {
      workspaceId: settings.workspaceId,
      autoCloseHours: settings.autoCloseHours,
      timezone: settings.timezone,
      language: settings.language,
      logoUrl: settings.logoUrl,
      businessHours: settings.businessHours,
      outOfHoursMessage: settings.outOfHoursMessage,
      smtpHost: settings.smtpHost,
      smtpPort: settings.smtpPort,
      smtpSecure: settings.smtpSecure,
      smtpUser: settings.smtpUser,
      smtpFromName: settings.smtpFromName,
      smtpFromEmail: settings.smtpFromEmail,
      smtpConfigured: Boolean(
        settings.smtpHost && settings.smtpPort && settings.smtpFromEmail,
      ),
      smtpPasswordConfigured: Boolean(settings.smtpPass),
    };
  }
}
