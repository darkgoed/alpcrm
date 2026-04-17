import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  assertPasswordPolicy,
  generateCompliantPassword,
} from '../common/utils/password-policy.util';

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
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

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

  async invite(dto: InviteUserDto, workspaceId: string, actorId?: string) {
    const exists = await this.prisma.user.findFirst({
      where: { email: dto.email, workspaceId },
    });
    if (exists)
      throw new ConflictException('E-mail já cadastrado neste workspace');

    // Gera senha temporária se não fornecida; retorna plain text uma única vez
    const rawPassword = dto.password ?? generateCompliantPassword(12);
    assertPasswordPolicy(rawPassword);
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

    this.audit.log({
      workspaceId,
      userId: actorId,
      action: 'create',
      entity: 'user',
      entityId: user.id,
      metadata: { email: user.email, name: user.name },
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

  async update(id: string, workspaceId: string, dto: UpdateUserDto, actorId?: string) {
    await this.assertExists(id, workspaceId);
    const result = await this.prisma.user.update({
      where: { id },
      data: dto,
      select: USER_SELECT,
    });
    this.audit.log({
      workspaceId,
      userId: actorId,
      action: 'update',
      entity: 'user',
      entityId: id,
      metadata: { fields: Object.keys(dto) },
    });
    return result;
  }

  // ─── Desativar usuário ───────────────────────────────────────────────────────

  async deactivate(id: string, workspaceId: string, actorId?: string) {
    await this.assertExists(id, workspaceId);
    const result = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: USER_SELECT,
    });
    this.audit.log({
      workspaceId,
      userId: actorId,
      action: 'deactivate',
      entity: 'user',
      entityId: id,
    });
    return result;
  }

  // ─── Atribuir role ao usuário ────────────────────────────────────────────────

  async assignRole(userId: string, roleId: string, workspaceId: string, actorId?: string) {
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

    this.audit.log({
      workspaceId,
      userId: actorId,
      action: 'assign_role',
      entity: 'user',
      entityId: userId,
      metadata: { roleId },
    });

    return this.findOne(userId, workspaceId);
  }

  // ─── Remover role do usuário ─────────────────────────────────────────────────

  async removeRole(userId: string, roleId: string, workspaceId: string, actorId?: string) {
    await this.assertExists(userId, workspaceId);
    await this.prisma.userRole.deleteMany({ where: { userId, roleId } });
    this.audit.log({
      workspaceId,
      userId: actorId,
      action: 'remove_role',
      entity: 'user',
      entityId: userId,
      metadata: { roleId },
    });
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
