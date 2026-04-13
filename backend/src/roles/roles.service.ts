import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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
  constructor(private prisma: PrismaService) {}

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

  async create(dto: CreateRoleDto, workspaceId: string) {
    const exists = await this.prisma.role.findFirst({
      where: { name: dto.name, workspaceId },
    });
    if (exists) throw new ConflictException('Já existe uma role com esse nome');

    return this.prisma.role.create({
      data: {
        workspaceId,
        name: dto.name,
        ...(dto.permissionIds?.length
          ? {
              rolePermissions: {
                create: dto.permissionIds.map((permissionId) => ({
                  permissionId,
                })),
              },
            }
          : {}),
      },
      include: ROLE_INCLUDE,
    });
  }

  // ─── Atualizar permissões da role (substitui todas) ──────────────────────────

  async updatePermissions(
    id: string,
    workspaceId: string,
    dto: UpdateRolePermissionsDto,
  ) {
    await this.assertExists(id, workspaceId);

    // Apaga todas as permissões atuais e recria (como um checkbox que salva tudo de uma vez)
    await this.prisma.rolePermission.deleteMany({ where: { roleId: id } });

    if (dto.permissionIds.length) {
      await this.prisma.rolePermission.createMany({
        data: dto.permissionIds.map((permissionId) => ({
          roleId: id,
          permissionId,
        })),
        skipDuplicates: true,
      });
    }

    return this.findOne(id, workspaceId);
  }

  // ─── Deletar role ────────────────────────────────────────────────────────────

  async remove(id: string, workspaceId: string) {
    const role = await this.assertExists(id, workspaceId);

    // Checar se ainda há usuários com essa role
    const count = await this.prisma.userRole.count({ where: { roleId: id } });
    if (count > 0) {
      throw new ConflictException(
        `Não é possível excluir: ${count} usuário(s) ainda possuem essa role`,
      );
    }

    await this.prisma.role.delete({ where: { id } });
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
}
