import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';

const ROLE_INCLUDE = {
  rolePermissions: {
    include: { permission: true },
  },
  _count: { select: { userRoles: true } },
};

@Injectable()
export class RolesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  // ─── Listar roles do workspace ───────────────────────────────────────────────

  findAll(workspaceId: string) {
    return this.prisma.role.findMany({
      where: { workspaceId },
      include: ROLE_INCLUDE,
      orderBy: { name: 'asc' },
    });
  }

  // ─── Buscar role por id ──────────────────────────────────────────────────────

  async findOne(id: string, workspaceId: string) {
    const role = await this.prisma.role.findFirst({
      where: { id, workspaceId },
      include: ROLE_INCLUDE,
    });
    if (!role) throw new NotFoundException('Role não encontrada');
    return role;
  }

  // ─── Criar role ──────────────────────────────────────────────────────────────

  async create(dto: CreateRoleDto, workspaceId: string, actorId?: string) {
    const exists = await this.prisma.role.findFirst({
      where: { name: dto.name, workspaceId },
    });
    if (exists) throw new ConflictException('Já existe uma role com esse nome');

    const permissionIds = await this.normalizePermissionIds(dto.permissionIds);

    const role = await this.prisma.role.create({
      data: {
        workspaceId,
        name: dto.name,
        ...(permissionIds.length
          ? {
              rolePermissions: {
                create: permissionIds.map((permissionId) => ({
                  permissionId,
                })),
              },
            }
          : {}),
      },
      include: ROLE_INCLUDE,
    });
    this.audit.log({
      workspaceId,
      userId: actorId,
      action: 'create',
      entity: 'role',
      entityId: role.id,
      metadata: { name: role.name },
    });
    return role;
  }

  // ─── Atualizar permissões da role (substitui todas) ──────────────────────────

  async updatePermissions(
    id: string,
    workspaceId: string,
    dto: UpdateRolePermissionsDto,
    actorId?: string,
  ) {
    await this.assertExists(id, workspaceId);
    const permissionIds = await this.normalizePermissionIds(dto.permissionIds);

    // Apaga todas as permissões atuais e recria (como um checkbox que salva tudo de uma vez)
    await this.prisma.rolePermission.deleteMany({ where: { roleId: id } });

    if (permissionIds.length) {
      await this.prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          roleId: id,
          permissionId,
        })),
        skipDuplicates: true,
      });
    }

    const result = await this.findOne(id, workspaceId);
    this.audit.log({
      workspaceId,
      userId: actorId,
      action: 'update_permissions',
      entity: 'role',
      entityId: id,
      metadata: { permissionIds },
    });
    return result;
  }

  // ─── Deletar role ────────────────────────────────────────────────────────────

  async remove(id: string, workspaceId: string, actorId?: string) {
    const role = await this.assertExists(id, workspaceId);

    // Checar se ainda há usuários com essa role
    const count = await this.prisma.userRole.count({ where: { roleId: id } });
    if (count > 0) {
      throw new ConflictException(
        `Não é possível excluir: ${count} usuário(s) ainda possuem essa role`,
      );
    }

    await this.prisma.role.delete({ where: { id } });
    this.audit.log({
      workspaceId,
      userId: actorId,
      action: 'delete',
      entity: 'role',
      entityId: id,
      metadata: { name: role.name },
    });
    return role;
  }

  // ─── Helper ──────────────────────────────────────────────────────────────────

  private async assertExists(id: string, workspaceId: string) {
    const role = await this.prisma.role.findFirst({
      where: { id, workspaceId },
    });
    if (!role) throw new NotFoundException('Role não encontrada');
    return role;
  }

  private async normalizePermissionIds(permissionIds: string[] = []) {
    const uniqueIds = [...new Set(permissionIds)];
    if (uniqueIds.length === 0) return uniqueIds;

    const foundPermissions = await this.prisma.permission.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true },
    });

    if (foundPermissions.length !== uniqueIds.length) {
      throw new BadRequestException(
        'Uma ou mais permissões informadas são inválidas',
      );
    }

    return uniqueIds;
  }
}
