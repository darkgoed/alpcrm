import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePipelineDto,
  UpdatePipelineDto,
  CreateStageDto,
  UpdateStageDto,
  ReorderStagesDto,
  MoveContactDto,
} from './dto/pipeline.dto';
import { FlowExecutorService } from '../automation/flow-executor.service';

@Injectable()
export class PipelinesService {
  constructor(
    private prisma: PrismaService,
    private flowExecutor: FlowExecutorService,
  ) {}

  // ─── Pipelines ────────────────────────────────────────────────────────────────

  async listPipelines(workspaceId: string) {
    return this.prisma.pipeline.findMany({
      where: { workspaceId },
      include: { stages: { orderBy: { order: 'asc' } } },
      orderBy: { name: 'asc' },
    });
  }

  async createPipeline(workspaceId: string, dto: CreatePipelineDto) {
    return this.prisma.pipeline.create({
      data: { workspaceId, name: dto.name },
      include: { stages: true },
    });
  }

  async updatePipeline(
    workspaceId: string,
    id: string,
    dto: UpdatePipelineDto,
  ) {
    const pipeline = await this.prisma.pipeline.findFirst({
      where: { id, workspaceId },
    });
    if (!pipeline) throw new NotFoundException('Pipeline não encontrado');
    return this.prisma.pipeline.update({
      where: { id },
      data: { name: dto.name },
    });
  }

  async deletePipeline(workspaceId: string, id: string) {
    const pipeline = await this.prisma.pipeline.findFirst({
      where: { id, workspaceId },
    });
    if (!pipeline) throw new NotFoundException('Pipeline não encontrado');
    await this.prisma.pipeline.delete({ where: { id } });
  }

  // ─── Stages ───────────────────────────────────────────────────────────────────

  async createStage(
    workspaceId: string,
    pipelineId: string,
    dto: CreateStageDto,
  ) {
    const pipeline = await this.prisma.pipeline.findFirst({
      where: { id: pipelineId, workspaceId },
    });
    if (!pipeline) throw new NotFoundException('Pipeline não encontrado');

    // Ordem padrão = último + 1
    const lastStage = await this.prisma.stage.findFirst({
      where: { pipelineId },
      orderBy: { order: 'desc' },
    });

    const order = dto.order ?? (lastStage ? lastStage.order + 1 : 0);

    return this.prisma.stage.create({
      data: {
        pipelineId,
        name: dto.name,
        color: dto.color ?? '#6366f1',
        order,
      },
    });
  }

  async updateStage(
    workspaceId: string,
    pipelineId: string,
    stageId: string,
    dto: UpdateStageDto,
  ) {
    const stage = await this.prisma.stage.findFirst({
      where: { id: stageId, pipelineId, pipeline: { workspaceId } },
    });
    if (!stage) throw new NotFoundException('Stage não encontrado');
    return this.prisma.stage.update({ where: { id: stageId }, data: dto });
  }

  async deleteStage(workspaceId: string, pipelineId: string, stageId: string) {
    const stage = await this.prisma.stage.findFirst({
      where: { id: stageId, pipelineId, pipeline: { workspaceId } },
    });
    if (!stage) throw new NotFoundException('Stage não encontrado');
    await this.prisma.stage.delete({ where: { id: stageId } });
  }

  async reorderStages(
    workspaceId: string,
    pipelineId: string,
    dto: ReorderStagesDto,
  ) {
    const pipeline = await this.prisma.pipeline.findFirst({
      where: { id: pipelineId, workspaceId },
    });
    if (!pipeline) throw new NotFoundException('Pipeline não encontrado');

    await this.prisma.$transaction(
      dto.stages.map(({ id, order }) =>
        this.prisma.stage.update({ where: { id }, data: { order } }),
      ),
    );
  }

  // ─── Kanban: contatos por pipeline ───────────────────────────────────────────

  async getKanban(workspaceId: string, pipelineId: string) {
    const pipeline = await this.prisma.pipeline.findFirst({
      where: { id: pipelineId, workspaceId },
      include: {
        stages: {
          orderBy: { order: 'asc' },
          include: {
            contactPipelines: {
              include: {
                contact: {
                  include: {
                    contactTags: { include: { tag: true } },
                    conversations: {
                      where: { status: 'open' },
                      select: { id: true },
                      take: 1,
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!pipeline) throw new NotFoundException('Pipeline não encontrado');
    return pipeline;
  }

  // ─── Mover contato entre stages ───────────────────────────────────────────────

  async moveContact(
    workspaceId: string,
    pipelineId: string,
    dto: MoveContactDto,
  ) {
    const pipeline = await this.prisma.pipeline.findFirst({
      where: { id: pipelineId, workspaceId },
    });
    if (!pipeline) throw new NotFoundException('Pipeline não encontrado');

    const stage = await this.prisma.stage.findFirst({
      where: { id: dto.stageId, pipelineId },
    });
    if (!stage)
      throw new BadRequestException('Stage não pertence a este pipeline');

    const contact = await this.prisma.contact.findFirst({
      where: { id: dto.contactId, workspaceId },
    });
    if (!contact) throw new NotFoundException('Contato não encontrado');

    const currentPipelineState = await this.prisma.contactPipeline.findUnique({
      where: { contactId_pipelineId: { contactId: dto.contactId, pipelineId } },
      select: { stageId: true },
    });

    const result = await this.prisma.contactPipeline.upsert({
      where: { contactId_pipelineId: { contactId: dto.contactId, pipelineId } },
      create: { contactId: dto.contactId, pipelineId, stageId: dto.stageId },
      update: { stageId: dto.stageId },
    });

    if (currentPipelineState?.stageId !== dto.stageId) {
      await this.flowExecutor.triggerForContactEvent(
        workspaceId,
        dto.contactId,
        'stage_changed',
        dto.stageId,
      );
    }

    return result;
  }

  // ─── Remover contato do pipeline ──────────────────────────────────────────────

  async removeContactFromPipeline(
    workspaceId: string,
    pipelineId: string,
    contactId: string,
  ) {
    const pipeline = await this.prisma.pipeline.findFirst({
      where: { id: pipelineId, workspaceId },
    });
    if (!pipeline) throw new NotFoundException('Pipeline não encontrado');

    await this.prisma.contactPipeline.deleteMany({
      where: { contactId, pipelineId },
    });
  }
}
