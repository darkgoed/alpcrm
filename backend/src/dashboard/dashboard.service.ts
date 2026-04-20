import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../gateway/events.gateway';

const INACTIVITY_MINUTES = 15;

type AgentCard = {
  userId: string;
  name: string;
  email: string;
  online: boolean;
  activeConversations: number;
  closedToday: number;
  avgResponseSeconds: number | null;
  teams: { id: string; name: string }[];
  inactive: boolean;
};

type TeamLoad = {
  teamId: string | null;
  name: string;
  activeConversations: number;
  memberCount: number;
  avgPerMember: number;
};

type StageBottleneck = {
  pipelineId: string;
  pipelineName: string;
  stageId: string;
  stageName: string;
  contacts: number;
  avgMinutesInStage: number | null;
};

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private events: EventsGateway,
  ) {}

  async getSummary(workspaceId: string) {
    const [
      totals,
      botHuman,
      queue,
      agents,
      teams,
      bottlenecks,
      apiUsage,
    ] = await Promise.all([
      this.getConversationTotals(workspaceId),
      this.getBotHumanSplit(workspaceId),
      this.getWaitingQueue(workspaceId),
      this.getAgents(workspaceId),
      this.getTeamsLoad(workspaceId),
      this.getPipelineBottlenecks(workspaceId),
      this.getApiUsage(workspaceId),
    ]);

    return {
      totals,
      botHuman,
      queue,
      agents,
      teams,
      bottlenecks,
      apiUsage,
    };
  }

  private async getConversationTotals(workspaceId: string) {
    const [total, open, closed] = await Promise.all([
      this.prisma.conversation.count({ where: { workspaceId } }),
      this.prisma.conversation.count({
        where: { workspaceId, status: 'open' },
      }),
      this.prisma.conversation.count({
        where: { workspaceId, status: 'closed' },
      }),
    ]);
    return { total, open, closed };
  }

  private async getBotHumanSplit(workspaceId: string) {
    const [bot, human] = await Promise.all([
      this.prisma.message.count({
        where: {
          conversation: { workspaceId },
          senderType: 'system',
        },
      }),
      this.prisma.message.count({
        where: {
          conversation: { workspaceId },
          senderType: 'user',
        },
      }),
    ]);
    const totalOutbound = bot + human;
    return {
      bot,
      human,
      total: totalOutbound,
      botRatio: totalOutbound === 0 ? 0 : bot / totalOutbound,
    };
  }

  private async getWaitingQueue(workspaceId: string) {
    const unassigned = await this.prisma.conversation.findMany({
      where: {
        workspaceId,
        status: 'open',
        assignedUserId: null,
      },
      select: {
        id: true,
        lastMessageAt: true,
        lastContactMessageAt: true,
        createdAt: true,
        contact: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { lastContactMessageAt: 'asc' },
      take: 20,
    });

    const now = Date.now();
    const items = unassigned.map((c) => {
      const since =
        c.lastContactMessageAt ?? c.lastMessageAt ?? c.createdAt ?? new Date();
      return {
        conversationId: c.id,
        contactId: c.contact.id,
        contactName: c.contact.name ?? c.contact.phone,
        waitingSeconds: Math.max(0, Math.floor((now - since.getTime()) / 1000)),
      };
    });

    return {
      count: unassigned.length,
      items,
      avgWaitSeconds:
        items.length === 0
          ? 0
          : Math.floor(
              items.reduce((acc, item) => acc + item.waitingSeconds, 0) /
                items.length,
            ),
    };
  }

  private async getAgents(workspaceId: string): Promise<AgentCard[]> {
    const users = await this.prisma.user.findMany({
      where: { workspaceId, isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        teamUsers: { select: { team: { select: { id: true, name: true } } } },
      },
      orderBy: { name: 'asc' },
    });

    const onlineIds = new Set(this.events.getOnlineUserIds(workspaceId));
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const cards: AgentCard[] = [];
    for (const user of users) {
      const [active, closedToday, avgResponseSeconds, lastSentMsg] =
        await Promise.all([
          this.prisma.conversation.count({
            where: {
              workspaceId,
              assignedUserId: user.id,
              status: 'open',
            },
          }),
          this.prisma.conversation.count({
            where: {
              workspaceId,
              assignedUserId: user.id,
              status: 'closed',
              updatedAt: { gte: startOfDay },
            },
          }),
          this.getAgentAvgResponseSeconds(workspaceId, user.id, startOfDay),
          this.prisma.message.findFirst({
            where: {
              senderType: 'user',
              senderId: user.id,
              conversation: { workspaceId },
            },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true },
          }),
        ]);

      const isOnline = onlineIds.has(user.id);
      const minutesIdle = lastSentMsg
        ? (Date.now() - lastSentMsg.createdAt.getTime()) / 60000
        : Number.POSITIVE_INFINITY;
      const inactive = isOnline && active > 0 && minutesIdle > INACTIVITY_MINUTES;

      cards.push({
        userId: user.id,
        name: user.name,
        email: user.email,
        online: isOnline,
        activeConversations: active,
        closedToday,
        avgResponseSeconds,
        teams: user.teamUsers.map(({ team }) => team),
        inactive,
      });
    }
    return cards;
  }

  private async getAgentAvgResponseSeconds(
    workspaceId: string,
    userId: string,
    since: Date,
  ): Promise<number | null> {
    const sent = await this.prisma.message.findMany({
      where: {
        conversation: { workspaceId, assignedUserId: userId },
        senderType: 'user',
        senderId: userId,
        createdAt: { gte: since },
      },
      select: {
        createdAt: true,
        conversationId: true,
      },
      orderBy: { createdAt: 'asc' },
      take: 500,
    });
    if (sent.length === 0) return null;

    const sums: number[] = [];
    for (const message of sent) {
      const prevContact = await this.prisma.message.findFirst({
        where: {
          conversationId: message.conversationId,
          senderType: 'contact',
          createdAt: { lt: message.createdAt },
        },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      });
      if (!prevContact) continue;
      const diff =
        (message.createdAt.getTime() - prevContact.createdAt.getTime()) / 1000;
      if (diff > 0 && diff < 60 * 60 * 24) sums.push(diff);
    }
    if (sums.length === 0) return null;
    return Math.floor(sums.reduce((acc, v) => acc + v, 0) / sums.length);
  }

  private async getTeamsLoad(workspaceId: string): Promise<TeamLoad[]> {
    const teams = await this.prisma.team.findMany({
      where: { workspaceId },
      select: {
        id: true,
        name: true,
        teamUsers: { select: { userId: true } },
      },
      orderBy: { name: 'asc' },
    });

    const loads: TeamLoad[] = [];
    for (const team of teams) {
      const active = await this.prisma.conversation.count({
        where: { workspaceId, teamId: team.id, status: 'open' },
      });
      const memberCount = team.teamUsers.length;
      loads.push({
        teamId: team.id,
        name: team.name,
        activeConversations: active,
        memberCount,
        avgPerMember: memberCount === 0 ? 0 : active / memberCount,
      });
    }

    const unassigned = await this.prisma.conversation.count({
      where: { workspaceId, teamId: null, status: 'open' },
    });
    if (unassigned > 0) {
      loads.push({
        teamId: null,
        name: 'Sem equipe',
        activeConversations: unassigned,
        memberCount: 0,
        avgPerMember: 0,
      });
    }
    return loads;
  }

  private async getPipelineBottlenecks(
    workspaceId: string,
  ): Promise<StageBottleneck[]> {
    const pipelines = await this.prisma.pipeline.findMany({
      where: { workspaceId },
      select: {
        id: true,
        name: true,
        stages: {
          orderBy: { order: 'asc' },
          select: { id: true, name: true },
        },
      },
    });

    const result: StageBottleneck[] = [];
    for (const pipeline of pipelines) {
      for (const stage of pipeline.stages) {
        const rows = await this.prisma.contactPipeline.findMany({
          where: { stageId: stage.id },
          select: { updatedAt: true },
        });
        const avgMinutes =
          rows.length === 0
            ? null
            : Math.floor(
                rows.reduce(
                  (acc, row) =>
                    acc + (Date.now() - row.updatedAt.getTime()) / 60000,
                  0,
                ) / rows.length,
              );
        result.push({
          pipelineId: pipeline.id,
          pipelineName: pipeline.name,
          stageId: stage.id,
          stageName: stage.name,
          contacts: rows.length,
          avgMinutesInStage: avgMinutes,
        });
      }
    }
    return result;
  }

  private async getApiUsage(workspaceId: string) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [sent, received] = await Promise.all([
      this.prisma.message.count({
        where: {
          conversation: { workspaceId },
          senderType: { in: ['user', 'system'] },
          createdAt: { gte: startOfMonth },
        },
      }),
      this.prisma.message.count({
        where: {
          conversation: { workspaceId },
          senderType: 'contact',
          createdAt: { gte: startOfMonth },
        },
      }),
    ]);

    const costPerMessage = Number(process.env.WHATSAPP_COST_PER_MESSAGE ?? 0);
    const currency = process.env.WHATSAPP_COST_CURRENCY ?? 'BRL';
    return {
      monthStart: startOfMonth.toISOString(),
      messagesSent: sent,
      messagesReceived: received,
      estimatedCost: Number((sent * costPerMessage).toFixed(2)),
      currency,
      costPerMessage,
    };
  }
}
