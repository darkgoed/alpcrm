import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
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
    // Cria workspace + usuário admin em uma transação
    const existing = await this.prisma.workspace.findUnique({ where: { slug: dto.workspaceSlug } });
    if (existing) throw new ConflictException('Workspace slug já está em uso');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const workspace = await this.prisma.workspace.create({
      data: {
        name: dto.workspaceName,
        slug: dto.workspaceSlug,
        users: {
          create: {
            name: dto.name,
            email: dto.email,
            password: hashedPassword,
          },
        },
      },
      include: { users: true },
    });

    const user = workspace.users[0];
    return this.signToken(user.id, user.email, workspace.id);
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

    if (!user || !user.isActive) throw new UnauthorizedException('Credenciais inválidas');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Credenciais inválidas');

    const permissions = user.userRoles.flatMap((ur) =>
      ur.role.rolePermissions.map((rp) => rp.permission.key),
    );

    return this.signToken(user.id, user.email, user.workspaceId, permissions);
  }

  private signToken(userId: string, email: string, workspaceId: string, permissions: string[] = []) {
    const payload = { sub: userId, email, workspaceId, permissions };
    return {
      access_token: this.jwt.sign(payload),
      workspaceId,
    };
  }
}
