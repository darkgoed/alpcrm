import { BadRequestException, Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from './encryption.service';

export interface WorkspaceSmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string | null;
  pass: string | null;
  fromName: string | null;
  fromEmail: string;
}

@Injectable()
export class MailService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
  ) {}

  async sendWorkspaceEmail(
    workspaceId: string,
    input: {
      to: string;
      subject: string;
      text: string;
      html?: string;
    },
  ) {
    const { workspaceName, config } =
      await this.getWorkspaceTransportConfig(workspaceId);
    const transporter = this.createTransport(config);

    await transporter.sendMail({
      from: {
        name: config.fromName || workspaceName,
        address: config.fromEmail,
      },
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
  }

  async verifyWorkspaceSmtpConfig(config: WorkspaceSmtpConfig) {
    const transporter = this.createTransport(config);
    await transporter.verify();
    return { success: true };
  }

  async getWorkspaceTransportConfig(workspaceId: string): Promise<{
    workspaceName: string;
    config: WorkspaceSmtpConfig;
  }> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        name: true,
        settings: {
          select: {
            smtpHost: true,
            smtpPort: true,
            smtpSecure: true,
            smtpUser: true,
            smtpPass: true,
            smtpFromName: true,
            smtpFromEmail: true,
          },
        },
      },
    });

    if (!workspace) {
      throw new BadRequestException('Workspace não encontrado');
    }

    return {
      workspaceName: workspace.name,
      config: this.normalizeConfig({
        host: workspace.settings?.smtpHost ?? null,
        port: workspace.settings?.smtpPort ?? null,
        secure: workspace.settings?.smtpSecure ?? false,
        user: workspace.settings?.smtpUser ?? null,
        pass: workspace.settings?.smtpPass
          ? this.encryption.decrypt(workspace.settings.smtpPass)
          : null,
        fromName: workspace.settings?.smtpFromName ?? null,
        fromEmail: workspace.settings?.smtpFromEmail ?? null,
      }),
    };
  }

  normalizeConfig(input: {
    host?: string | null;
    port?: number | null;
    secure?: boolean | null;
    user?: string | null;
    pass?: string | null;
    fromName?: string | null;
    fromEmail?: string | null;
  }): WorkspaceSmtpConfig {
    const host = input.host?.trim() ?? '';
    const port = input.port ?? null;
    const fromEmail = input.fromEmail?.trim() ?? '';
    const user = input.user?.trim() || null;
    const pass = input.pass?.trim() || null;

    if (!host || !port || !fromEmail) {
      throw new BadRequestException(
        'SMTP incompleto. Configure host, porta e e-mail remetente.',
      );
    }

    if ((user && !pass) || (!user && pass)) {
      throw new BadRequestException(
        'Usuário e senha SMTP devem ser informados juntos.',
      );
    }

    return {
      host,
      port,
      secure: Boolean(input.secure),
      user,
      pass,
      fromName: input.fromName?.trim() || null,
      fromEmail,
    };
  }

  private createTransport(config: WorkspaceSmtpConfig) {
    return nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth:
        config.user && config.pass
          ? {
              user: config.user,
              pass: config.pass,
            }
          : undefined,
    });
  }
}
