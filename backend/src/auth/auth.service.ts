import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.workspace.findUnique({
      where: { slug: dto.workspaceSlug },
    });
    if (existing) throw new ConflictException('Workspace slug já está em uso');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Buscar todas as permissões do sistema para dar ao admin
    const allPermissions = await this.prisma.permission.findMany();

    // Tudo em uma transação: workspace → role admin → usuário → vínculo role
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Criar workspace
      const workspace = await tx.workspace.create({
        data: { name: dto.workspaceName, slug: dto.workspaceSlug },
      });

      // 2. Criar role "admin" com todas as permissões
      const adminRole = await tx.role.create({
        data: {
          workspaceId: workspace.id,
          name: 'admin',
          rolePermissions: {
            create: allPermissions.map((p) => ({ permissionId: p.id })),
          },
        },
      });

      // 3. Criar usuário e associar role admin
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
    return this.signToken(
      result.user.id,
      result.user.email,
      result.workspace.id,
      permissions,
    );
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email },
      include: {
        workspace: true,
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.isActive)
      throw new UnauthorizedException('Credenciais inválidas');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Credenciais inválidas');

    // Deduplica permissões caso o usuário tenha múltiplas roles
    const permissions = [
      ...new Set(
        user.userRoles.flatMap((ur) =>
          ur.role.rolePermissions.map((rp) => rp.permission.key),
        ),
      ),
    ];

    return this.signToken(user.id, user.email, user.workspaceId, permissions);
  }

  private signToken(
    userId: string,
    email: string,
    workspaceId: string,
    permissions: string[] = [],
  ) {
    const payload = { sub: userId, email, workspaceId, permissions };
    return {
      access_token: this.jwt.sign(payload),
      workspaceId,
      permissions,
    };
  }
}
