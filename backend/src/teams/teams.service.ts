import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';

const TEAM_INCLUDE = {
  teamUsers: {
    include: {
      user: { select: { id: true, name: true, email: true, isActive: true } },
    },
  },
  _count: { select: { conversations: true } },
};

@Injectable()
export class TeamsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  // ─── Listar equipes ──────────────────────────────────────────────────────────

  findAll(workspaceId: string) {
    return this.prisma.team.findMany({
      where: { workspaceId },
      include: TEAM_INCLUDE,
      orderBy: { name: 'asc' },
    });
  }

  // ─── Buscar equipe por id ────────────────────────────────────────────────────

  async findOne(id: string, workspaceId: string) {
    const team = await this.prisma.team.findFirst({
      where: { id, workspaceId },
      include: TEAM_INCLUDE,
    });
    if (!team) throw new NotFoundException('Equipe não encontrada');
    return team;
  }

  // ─── Criar equipe ────────────────────────────────────────────────────────────

  async create(dto: CreateTeamDto, workspaceId: string, actorId?: string) {
    const exists = await this.prisma.team.findFirst({
      where: { name: dto.name, workspaceId },
    });
    if (exists)
      throw new ConflictException('Já existe uma equipe com esse nome');

    const team = await this.prisma.team.create({
      data: {
        workspaceId,
        name: dto.name,
        ...(dto.userIds?.length
          ? { teamUsers: { create: dto.userIds.map((userId) => ({ userId })) } }
          : {}),
      },
      include: TEAM_INCLUDE,
    });
    this.audit.log({
      workspaceId,
      userId: actorId,
      action: 'create',
      entity: 'team',
      entityId: team.id,
      metadata: { name: team.name },
    });
    return team;
  }

  // ─── Atualizar nome da equipe ────────────────────────────────────────────────

  async update(
    id: string,
    workspaceId: string,
    dto: UpdateTeamDto,
    actorId?: string,
  ) {
    await this.assertExists(id, workspaceId);
    const result = await this.prisma.team.update({
      where: { id },
      data: dto,
      include: TEAM_INCLUDE,
    });
    this.audit.log({
      workspaceId,
      userId: actorId,
      action: 'update',
      entity: 'team',
      entityId: id,
      metadata: { fields: Object.keys(dto) },
    });
    return result;
  }

  // ─── Deletar equipe ──────────────────────────────────────────────────────────

  async remove(id: string, workspaceId: string, actorId?: string) {
    await this.assertExists(id, workspaceId);
    await this.prisma.team.delete({ where: { id } });
    this.audit.log({
      workspaceId,
      userId: actorId,
      action: 'delete',
      entity: 'team',
      entityId: id,
    });
    return { message: 'Equipe removida' };
  }

  // ─── Adicionar membro ────────────────────────────────────────────────────────

  async addMember(
    teamId: string,
    userId: string,
    workspaceId: string,
    actorId?: string,
  ) {
    await this.assertExists(teamId, workspaceId);

    const user = await this.prisma.user.findFirst({
      where: { id: userId, workspaceId },
    });
    if (!user)
      throw new NotFoundException('Usuário não encontrado neste workspace');

    await this.prisma.teamUser.upsert({
      where: { teamId_userId: { teamId, userId } },
      update: {},
      create: { teamId, userId },
    });

    this.audit.log({
      workspaceId,
      userId: actorId,
      action: 'add_member',
      entity: 'team',
      entityId: teamId,
      metadata: { memberId: userId },
    });

    return this.findOne(teamId, workspaceId);
  }

  // ─── Remover membro ──────────────────────────────────────────────────────────

  async removeMember(
    teamId: string,
    userId: string,
    workspaceId: string,
    actorId?: string,
  ) {
    await this.assertExists(teamId, workspaceId);
    await this.prisma.teamUser.deleteMany({ where: { teamId, userId } });
    this.audit.log({
      workspaceId,
      userId: actorId,
      action: 'remove_member',
      entity: 'team',
      entityId: teamId,
      metadata: { memberId: userId },
    });
    return this.findOne(teamId, workspaceId);
  }

  // ─── Buscar próximo membro disponível (round-robin) ─────────────────────────

  async getNextMember(teamId: string): Promise<string | null> {
    const members = await this.prisma.teamUser.findMany({
      where: { teamId, user: { isActive: true } },
      include: {
        user: {
          include: {
            // Conta conversas abertas atribuídas ao usuário (carga atual)
            assignedConvs: { where: { status: 'open' } },
          },
        },
      },
    });

    if (!members.length) return null;

    // Ordena pelo menor número de conversas abertas (operador com menor carga)
    members.sort(
      (a, b) => a.user.assignedConvs.length - b.user.assignedConvs.length,
    );

    return members[0].userId;
  }

  // ─── Helper ──────────────────────────────────────────────────────────────────

  private async assertExists(id: string, workspaceId: string) {
    const team = await this.prisma.team.findFirst({
      where: { id, workspaceId },
    });
    if (!team) throw new NotFoundException('Equipe não encontrada');
    return team;
  }
}
