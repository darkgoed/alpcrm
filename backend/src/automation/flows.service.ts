import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFlowDto, CreateFlowEdgeDto, CreateFlowNodeDto, UpdateFlowDto } from './dto/create-flow.dto';

@Injectable()
export class FlowsService {
  constructor(private prisma: PrismaService) {}

  async findAll(workspaceId: string) {
    return this.prisma.flow.findMany({
      where: { workspaceId },
      include: { nodes: { orderBy: { order: 'asc' } }, edges: true },
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: string, workspaceId: string) {
    const flow = await this.prisma.flow.findFirst({
      where: { id, workspaceId },
      include: { nodes: { orderBy: { order: 'asc' } }, edges: true },
    });
    if (!flow) throw new NotFoundException('Flow não encontrado');
    return flow;
  }

  async create(dto: CreateFlowDto, workspaceId: string) {
    const { nodes = [], edges = [], ...flowData } = dto;

    const flow = await this.prisma.flow.create({
      data: { ...flowData, workspaceId },
    });

    const nodeIdMap = await this.createNodes(flow.id, nodes);
    await this.createEdges(flow.id, edges, nodeIdMap);

    // Legacy linear link: se não há edges, encadeia nextId automaticamente
    if (edges.length === 0 && nodeIdMap.size > 1) {
      const ids = [...nodeIdMap.values()];
      for (let i = 0; i < ids.length - 1; i++) {
        await this.prisma.flowNode.update({ where: { id: ids[i] }, data: { nextId: ids[i + 1] } });
      }
    }

    return this.findOne(flow.id, workspaceId);
  }

  async update(id: string, dto: UpdateFlowDto, workspaceId: string) {
    await this.findOne(id, workspaceId);
    const { nodes, edges = [], ...flowData } = dto;

    await this.prisma.flow.update({ where: { id }, data: flowData });

    if (nodes !== undefined) {
      await this.prisma.flowNode.deleteMany({ where: { flowId: id } });
      // edges são excluídos em cascata via FK

      const nodeIdMap = await this.createNodes(id, nodes);
      await this.createEdges(id, edges, nodeIdMap);

      // Legacy: encadeia nextId se sem edges
      if (edges.length === 0 && nodeIdMap.size > 1) {
        const ids = [...nodeIdMap.values()];
        for (let i = 0; i < ids.length - 1; i++) {
          await this.prisma.flowNode.update({ where: { id: ids[i] }, data: { nextId: ids[i + 1] } });
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

  // ─── Helpers ────────────────────────────────────────────────────────────────

  /** Cria nós e retorna map clientId → dbId */
  private async createNodes(flowId: string, nodes: CreateFlowNodeDto[]): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    for (const n of nodes) {
      const created = await this.prisma.flowNode.create({
        data: { flowId, type: n.type, config: n.config, order: n.order },
      });
      // usa clientId fornecido ou índice de ordem como chave
      const key = n.clientId ?? String(n.order);
      map.set(key, created.id);
    }
    return map;
  }

  /** Cria edges resolvendo clientIds para dbIds */
  private async createEdges(
    flowId: string,
    edges: CreateFlowEdgeDto[],
    nodeIdMap: Map<string, string>,
  ) {
    for (const e of edges) {
      const fromNodeId = nodeIdMap.get(e.fromClientId);
      const toNodeId = nodeIdMap.get(e.toClientId);
      if (!fromNodeId || !toNodeId) continue;

      await this.prisma.flowEdge.create({
        data: { flowId, fromNodeId, toNodeId, label: e.label ?? null },
      });
    }
  }
}
