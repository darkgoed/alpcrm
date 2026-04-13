import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

// Campos retornados — nunca expõe o hash da senha
const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  isActive: true,
  mustChangePassword: true,
  createdAt: true,
  userRoles: {
    include: {
      role: {
        include: {
          rolePermissions: { include: { permission: true } },
        },
      },
    },
  },
};

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // ─── Listar usuários do workspace ────────────────────────────────────────────

  findAll(workspaceId: string) {
    return this.prisma.user.findMany({
      where: { workspaceId },
      select: USER_SELECT,
      orderBy: { name: 'asc' },
    });
  }

  // ─── Buscar um usuário ───────────────────────────────────────────────────────

  async findOne(id: string, workspaceId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, workspaceId },
      select: USER_SELECT,
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  // ─── Convidar (criar) novo operador ─────────────────────────────────────────

  async invite(dto: InviteUserDto, workspaceId: string) {
    const exists = await this.prisma.user.findFirst({
      where: { email: dto.email, workspaceId },
    });
    if (exists)
      throw new ConflictException('E-mail já cadastrado neste workspace');

    // Gera senha temporária se não fornecida; retorna plain text uma única vez
    const rawPassword = dto.password ?? crypto.randomBytes(8).toString('hex');
    const password = await bcrypt.hash(rawPassword, 10);

    const user = await this.prisma.user.create({
      data: {
        workspaceId,
        name: dto.name,
        email: dto.email,
        password,
        mustChangePassword: true,
        ...(dto.roleId
          ? { userRoles: { create: { roleId: dto.roleId } } }
          : {}),
      },
      select: USER_SELECT,
    });

    // Retorna senha plain text apenas no momento da criação
    return { ...user, temporaryPassword: rawPassword };
  }

  // ─── Redefinir senha ─────────────────────────────────────────────────────────

  async resetPassword(id: string, workspaceId: string) {
    await this.assertExists(id, workspaceId);
    const rawPassword = crypto.randomBytes(8).toString('hex');
    const password = await bcrypt.hash(rawPassword, 10);
    await this.prisma.user.update({
      where: { id },
      data: { password, mustChangePassword: true },
    });
    return { temporaryPassword: rawPassword };
  }

  // ─── Atualizar usuário ───────────────────────────────────────────────────────

  async update(id: string, workspaceId: string, dto: UpdateUserDto) {
    await this.assertExists(id, workspaceId);
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: USER_SELECT,
    });
  }

  // ─── Desativar usuário ───────────────────────────────────────────────────────

  async deactivate(id: string, workspaceId: string) {
    await this.assertExists(id, workspaceId);
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: USER_SELECT,
    });
  }

  // ─── Atribuir role ao usuário ────────────────────────────────────────────────

  async assignRole(userId: string, roleId: string, workspaceId: string) {
    await this.assertExists(userId, workspaceId);

    const role = await this.prisma.role.findFirst({
      where: { id: roleId, workspaceId },
    });
    if (!role) throw new NotFoundException('Role não encontrada');

    // Upsert — evita duplicata silenciosamente
    await this.prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId } },
      update: {},
      create: { userId, roleId },
    });

    return this.findOne(userId, workspaceId);
  }

  // ─── Remover role do usuário ─────────────────────────────────────────────────

  async removeRole(userId: string, roleId: string, workspaceId: string) {
    await this.assertExists(userId, workspaceId);
    await this.prisma.userRole.deleteMany({ where: { userId, roleId } });
    return this.findOne(userId, workspaceId);
  }

  // ─── Helper ──────────────────────────────────────────────────────────────────

  private async assertExists(id: string, workspaceId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, workspaceId },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }
}
