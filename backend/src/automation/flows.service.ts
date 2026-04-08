import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFlowDto, UpdateFlowDto } from './dto/create-flow.dto';

@Injectable()
export class FlowsService {
  constructor(private prisma: PrismaService) {}

  async findAll(workspaceId: string) {
    return this.prisma.flow.findMany({
      where: { workspaceId },
      include: { nodes: { orderBy: { order: 'asc' } } },
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: string, workspaceId: string) {
    const flow = await this.prisma.flow.findFirst({
      where: { id, workspaceId },
      include: { nodes: { orderBy: { order: 'asc' } } },
    });
    if (!flow) throw new NotFoundException('Flow não encontrado');
    return flow;
  }

  async create(dto: CreateFlowDto, workspaceId: string) {
    const { nodes = [], ...flowData } = dto;

    return this.prisma.flow.create({
      data: {
        ...flowData,
        workspaceId,
        nodes: {
          create: nodes.map((n) => ({
            type: n.type,
            config: n.config,
            order: n.order,
          })),
        },
      },
      include: { nodes: { orderBy: { order: 'asc' } } },
    });
  }

  async update(id: string, dto: UpdateFlowDto, workspaceId: string) {
    await this.findOne(id, workspaceId);
    const { nodes, ...flowData } = dto;

    // Atualiza dados do flow
    await this.prisma.flow.update({ where: { id }, data: flowData });

    // Se nodes foram enviados, substitui todos
    if (nodes !== undefined) {
      await this.prisma.flowNode.deleteMany({ where: { flowId: id } });

      if (nodes.length > 0) {
        // Cria os nós em sequência para linkar next_id
        const created: string[] = [];
        for (const n of nodes) {
          const node = await this.prisma.flowNode.create({
            data: { flowId: id, type: n.type, config: n.config, order: n.order },
          });
          created.push(node.id);
        }

        // Liga next_id em cadeia
        for (let i = 0; i < created.length - 1; i++) {
          await this.prisma.flowNode.update({
            where: { id: created[i] },
            data: { nextId: created[i + 1] },
          });
        }
      }
    }

    return this.findOne(id, workspaceId);
  }

  async remove(id: string, workspaceId: string) {
    await this.findOne(id, workspaceId);
    await this.prisma.flow.delete({ where: { id } });
    return { ok: true };
  }

  async toggleActive(id: string, workspaceId: string) {
    const flow = await this.findOne(id, workspaceId);
    return this.prisma.flow.update({
      where: { id },
      data: { isActive: !flow.isActive },
    });
  }
}
