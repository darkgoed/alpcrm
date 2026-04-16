import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { readJwtSecretRotationConfig } from './jwt-secret.util';

const REFRESH_TOKEN_TTL_DAYS = 7;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private audit: AuditService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.workspace.findUnique({
      where: { slug: dto.workspaceSlug },
    });
    if (existing) throw new ConflictException('Workspace slug já está em uso');

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

    return this.issueTokenPair(
      authenticatedUser.id,
      authenticatedUser.email,
      authenticatedUser.workspaceId,
      permissions,
    );
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
}
