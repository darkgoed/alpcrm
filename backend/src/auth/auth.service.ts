import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EncryptionService } from '../common/services/encryption.service';
import { MailService } from '../common/services/mail.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { readJwtSecretRotationConfig } from './jwt-secret.util';
import { assertPasswordPolicy } from '../common/utils/password-policy.util';
import {
  buildTotpOtpauthUrl,
  generateTotpSecret,
  verifyTotpCode,
} from './totp.util';

const REFRESH_TOKEN_TTL_DAYS = 7;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private audit: AuditService,
    private config: ConfigService,
    private encryption: EncryptionService,
    private mail: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.workspace.findUnique({
      where: { slug: dto.workspaceSlug },
    });
    if (existing) throw new ConflictException('Workspace slug já está em uso');

    assertPasswordPolicy(dto.password);
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const allPermissions = await this.prisma.permission.findMany();

    const result = await this.prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: { name: dto.workspaceName, slug: dto.workspaceSlug },
      });

      const adminRole = await tx.role.create({
        data: {
          workspaceId: workspace.id,
          name: 'admin',
          rolePermissions: {
            create: allPermissions.map((p) => ({ permissionId: p.id })),
          },
        },
      });

      const user = await tx.user.create({
        data: {
          workspaceId: workspace.id,
          name: dto.name,
          email: dto.email,
          password: hashedPassword,
          userRoles: { create: { roleId: adminRole.id } },
        },
      });

      return { workspace, user };
    });

    const permissions = allPermissions.map((p) => p.key);
    return this.issueTokenPair(
      result.user.id,
      result.user.email,
      result.workspace.id,
      permissions,
    );
  }

  async login(dto: LoginDto) {
    const users = await this.prisma.user.findMany({
      where: { email: dto.email, isActive: true },
      orderBy: { updatedAt: 'desc' },
      include: {
        workspace: true,
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });

    if (users.length === 0) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const matchingUsers = await Promise.all(
      users.map(async (user) => ({
        user,
        valid: await bcrypt.compare(dto.password, user.password),
      })),
    );

    const authenticatedUser = matchingUsers.find(({ valid }) => valid)?.user;
    if (!authenticatedUser)
      throw new UnauthorizedException('Credenciais inválidas');

    if (authenticatedUser.twoFactorEnabled) {
      const secret = authenticatedUser.twoFactorSecret
        ? this.encryption.decrypt(authenticatedUser.twoFactorSecret)
        : null;

      if (!dto.twoFactorCode) {
        throw new UnauthorizedException({
          message: 'Código do autenticador é obrigatório',
          code: 'TWO_FACTOR_REQUIRED',
        });
      }

      if (!secret || !verifyTotpCode(secret, dto.twoFactorCode)) {
        throw new UnauthorizedException({
          message: 'Código 2FA inválido',
          code: 'TWO_FACTOR_INVALID',
        });
      }
    }

    const permissions = [
      ...new Set(
        authenticatedUser.userRoles.flatMap((ur) =>
          ur.role.rolePermissions.map((rp) => rp.permission.key),
        ),
      ),
    ];

    this.audit.log({
      workspaceId: authenticatedUser.workspaceId,
      userId: authenticatedUser.id,
      action: 'login',
      entity: 'user',
      entityId: authenticatedUser.id,
    });

    const tokens = await this.issueTokenPair(
      authenticatedUser.id,
      authenticatedUser.email,
      authenticatedUser.workspaceId,
      permissions,
    );
    return {
      ...tokens,
      mustChangePassword: authenticatedUser.mustChangePassword,
    };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new UnauthorizedException('Senha atual incorreta');

    if (currentPassword === newPassword) {
      throw new BadRequestException('A nova senha deve ser diferente da atual');
    }

    assertPasswordPolicy(newPassword);

    const password = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password, mustChangePassword: false },
    });

    // Revoga todos os refresh tokens — força re-login nos outros dispositivos
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    this.audit.log({
      workspaceId: user.workspaceId,
      userId,
      action: 'change_password',
      entity: 'user',
      entityId: userId,
    });

    return { success: true };
  }

  async forgotPassword(email: string) {
    const users = await this.prisma.user.findMany({
      where: { email, isActive: true },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const appUrl =
      this.config.get<string>('APP_URL')?.trim() || 'http://localhost:3001';

    await Promise.all(
      users.map(async (user) => {
        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = this.hashToken(token);
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

        await this.prisma.passwordResetToken.updateMany({
          where: { userId: user.id, usedAt: null },
          data: { usedAt: new Date() },
        });

        await this.prisma.passwordResetToken.create({
          data: {
            userId: user.id,
            tokenHash,
            expiresAt,
          },
        });

        const resetUrl = `${appUrl.replace(/\/+$/, '')}/reset-password?token=${encodeURIComponent(token)}`;
        const subject = `Recuperação de senha - ${user.workspace.name}`;
        const text = [
          `Olá, ${user.name}.`,
          '',
          `Recebemos uma solicitação para redefinir sua senha no workspace ${user.workspace.name}.`,
          'Acesse o link abaixo para criar uma nova senha:',
          resetUrl,
          '',
          'Se você não solicitou esta alteração, ignore este e-mail.',
          'Este link expira em 1 hora.',
        ].join('\n');
        const html = `<p>Olá, ${escapeHtml(user.name)}.</p><p>Recebemos uma solicitação para redefinir sua senha no workspace <strong>${escapeHtml(user.workspace.name)}</strong>.</p><p><a href="${resetUrl}">Clique aqui para criar uma nova senha</a></p><p>Se você não solicitou esta alteração, ignore este e-mail.</p><p>Este link expira em 1 hora.</p>`;

        try {
          await this.mail.sendWorkspaceEmail(user.workspaceId, {
            to: user.email,
            subject,
            text,
            html,
          });
        } catch {
          await this.prisma.passwordResetToken.updateMany({
            where: { tokenHash, usedAt: null },
            data: { usedAt: new Date() },
          });
        }
      }),
    );

    return {
      success: true,
      message:
        'Se o e-mail existir e o workspace tiver SMTP configurado, enviaremos um link de recuperação.',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    assertPasswordPolicy(newPassword);

    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: this.hashToken(token) },
      include: { user: true },
    });

    if (
      !resetToken ||
      resetToken.usedAt !== null ||
      resetToken.expiresAt < new Date() ||
      !resetToken.user.isActive
    ) {
      throw new BadRequestException(
        'Token de recuperação inválido ou expirado',
      );
    }

    const samePassword = await bcrypt.compare(
      newPassword,
      resetToken.user.password,
    );
    if (samePassword) {
      throw new BadRequestException(
        'A nova senha deve ser diferente da senha atual',
      );
    }

    const password = await bcrypt.hash(newPassword, 10);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { password, mustChangePassword: false },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: resetToken.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    this.audit.log({
      workspaceId: resetToken.user.workspaceId,
      userId: resetToken.userId,
      action: 'reset_password',
      entity: 'user',
      entityId: resetToken.userId,
    });

    return { success: true };
  }

  async getTwoFactorStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        twoFactorEnabled: true,
        twoFactorPendingSecret: true,
      },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    return {
      enabled: user.twoFactorEnabled,
      pendingSetup: Boolean(user.twoFactorPendingSecret),
    };
  }

  async setupTwoFactor(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        workspace: { select: { name: true } },
      },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const secret = generateTotpSecret();
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorPendingSecret: this.encryption.encrypt(secret),
      },
    });

    return {
      secret,
      otpauthUrl: buildTotpOtpauthUrl({
        secret,
        email: user.email,
        workspaceName: user.workspace.name,
      }),
    };
  }

  async enableTwoFactor(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const pendingSecret = user.twoFactorPendingSecret
      ? this.encryption.decrypt(user.twoFactorPendingSecret)
      : null;
    if (!pendingSecret) {
      throw new BadRequestException('Nenhuma configuração 2FA pendente');
    }
    if (!verifyTotpCode(pendingSecret, code)) {
      throw new BadRequestException('Código do autenticador inválido');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: this.encryption.encrypt(pendingSecret),
        twoFactorPendingSecret: null,
      },
    });

    this.audit.log({
      workspaceId: user.workspaceId,
      userId,
      action: 'enable_2fa',
      entity: 'user',
      entityId: userId,
    });

    return { success: true };
  }

  async disableTwoFactor(userId: string, currentPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new UnauthorizedException('Senha atual incorreta');

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorPendingSecret: null,
      },
    });

    this.audit.log({
      workspaceId: user.workspaceId,
      userId,
      action: 'disable_2fa',
      entity: 'user',
      entityId: userId,
    });

    return { success: true };
  }

  async refresh(refreshTokenValue: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshTokenValue },
      include: {
        user: {
          include: {
            userRoles: {
              include: {
                role: {
                  include: {
                    rolePermissions: { include: { permission: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (
      !stored ||
      stored.revokedAt !== null ||
      stored.expiresAt < new Date() ||
      !stored.user.isActive
    ) {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }

    // Revoke the used token (rotation)
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const permissions: string[] = [
      ...new Set(
        stored.user.userRoles.flatMap((ur) =>
          ur.role.rolePermissions.map((rp) => rp.permission.key),
        ),
      ),
    ];

    return this.issueTokenPair(
      stored.user.id,
      stored.user.email,
      stored.user.workspaceId,
      permissions,
    );
  }

  async logout(refreshTokenValue: string) {
    await this.prisma.refreshToken.updateMany({
      where: { token: refreshTokenValue, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async listSessions(userId: string) {
    const sessions = await this.prisma.refreshToken.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        expiresAt: true,
      },
    });
    return sessions;
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.refreshToken.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) throw new NotFoundException('Sessão não encontrada');
    if (session.revokedAt) return { success: true };

    await this.prisma.refreshToken.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      this.audit.log({
        workspaceId: user.workspaceId,
        userId,
        action: 'revoke_session',
        entity: 'refresh_token',
        entityId: session.id,
      });
    }

    return { success: true };
  }

  async revokeAllSessions(userId: string, exceptRefreshToken?: string | null) {
    const toExclude = exceptRefreshToken
      ? await this.prisma.refreshToken.findUnique({
          where: { token: exceptRefreshToken },
          select: { id: true, userId: true },
        })
      : null;

    const where: Record<string, unknown> = { userId, revokedAt: null };
    if (toExclude && toExclude.userId === userId) {
      where.id = { not: toExclude.id };
    }

    const result = await this.prisma.refreshToken.updateMany({
      where,
      data: { revokedAt: new Date() },
    });

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user && result.count > 0) {
      this.audit.log({
        workspaceId: user.workspaceId,
        userId,
        action: 'revoke_all_sessions',
        entity: 'user',
        entityId: userId,
        metadata: { revoked: result.count },
      });
    }
    return { revoked: result.count };
  }

  private async issueTokenPair(
    userId: string,
    email: string,
    workspaceId: string,
    permissions: string[] = [],
  ) {
    const payload = { sub: userId, email, workspaceId, permissions };
    const jwtRotation = readJwtSecretRotationConfig(this.config);
    const access_token = this.jwt.sign(payload, {
      secret: jwtRotation.currentSecret,
      expiresIn: this.config.get('JWT_EXPIRES_IN', '7d'),
      header: { alg: 'HS256', kid: jwtRotation.currentKid },
    });

    const rawToken = crypto.randomBytes(48).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS);

    await this.prisma.refreshToken.create({
      data: { userId, token: rawToken, expiresAt },
    });

    return { access_token, refresh_token: rawToken, workspaceId, permissions };
  }

  private hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
