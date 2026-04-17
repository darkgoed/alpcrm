import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ContactLifecycleStage, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContactMergeService {
  constructor(private prisma: PrismaService) {}

  async merge(
    workspaceId: string,
    sourceContactId: string,
    targetContactId: string,
  ): Promise<{ targetId: string }> {
    if (sourceContactId === targetContactId) {
      throw new BadRequestException(
        'Selecione contatos diferentes para mesclar',
      );
    }

    const contacts = await this.prisma.contact.findMany({
      where: { workspaceId, id: { in: [sourceContactId, targetContactId] } },
      include: {
        contactTags: { select: { tagId: true } },
        contactPipelines: true,
        flowStates: true,
      },
    });

    const source = contacts.find((contact) => contact.id === sourceContactId);
    const target = contacts.find((contact) => contact.id === targetContactId);

    if (!source || !target) {
      throw new NotFoundException('Contato não encontrado');
    }

    const mergedCustomFields = this.mergeCustomFields(
      source.customFields,
      target.customFields,
    );

    const mergedOptInStatus =
      target.optInStatus !== 'unknown'
        ? target.optInStatus
        : source.optInStatus;
    const mergedOptInAt = target.optInAt ?? source.optInAt;
    const mergedLifecycleStage = this.mergeLifecycleStage(
      source.lifecycleStage,
      target.lifecycleStage,
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.contact.update({
        where: { id: target.id },
        data: {
          name: target.name ?? source.name,
          email: target.email ?? source.email,
          company: target.company ?? source.company,
          ownerId: target.ownerId ?? source.ownerId,
          source: target.source === 'manual' ? target.source : source.source,
          lifecycleStage: mergedLifecycleStage,
          optInStatus: mergedOptInStatus,
          optInAt: mergedOptInAt,
          customFields: mergedCustomFields,
        },
      });

      await tx.conversation.updateMany({
        where: { workspaceId, contactId: source.id },
        data: { contactId: target.id },
      });

      for (const tag of source.contactTags) {
        await tx.contactTag.upsert({
          where: {
            contactId_tagId: { contactId: target.id, tagId: tag.tagId },
          },
          create: { contactId: target.id, tagId: tag.tagId },
          update: {},
        });
      }

      for (const pipeline of source.contactPipelines) {
        const existingPipeline = target.contactPipelines.find(
          (item) => item.pipelineId === pipeline.pipelineId,
        );

        if (existingPipeline) continue;

        await tx.contactPipeline.create({
          data: {
            contactId: target.id,
            pipelineId: pipeline.pipelineId,
            stageId: pipeline.stageId,
          },
        });
      }

      for (const flowState of source.flowStates) {
        const existingFlowState = target.flowStates.find(
          (item) => item.flowId === flowState.flowId,
        );

        if (existingFlowState) continue;

        await tx.contactFlowState.create({
          data: {
            contactId: target.id,
            flowId: flowState.flowId,
            currentNodeId: flowState.currentNodeId,
            isActive: flowState.isActive,
          },
        });
      }

      await tx.contact.delete({ where: { id: source.id } });
    });

    return { targetId: target.id };
  }

  private mergeCustomFields(
    source: Prisma.JsonValue,
    target: Prisma.JsonValue,
  ): Prisma.InputJsonObject {
    const sourceFields = this.asStringRecord(source);
    const targetFields = this.asStringRecord(target);
    return {
      ...sourceFields,
      ...targetFields,
    } as Prisma.InputJsonObject;
  }

  private asStringRecord(value: Prisma.JsonValue): Record<string, string> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }

    return Object.entries(value).reduce<Record<string, string>>(
      (acc, [key, rawValue]) => {
        if (typeof rawValue !== 'string') return acc;
        acc[key] = rawValue;
        return acc;
      },
      {},
    );
  }

  private mergeLifecycleStage(
    source: ContactLifecycleStage,
    target: ContactLifecycleStage,
  ): ContactLifecycleStage {
    const rank: Record<ContactLifecycleStage, number> = {
      inactive: 0,
      lead: 1,
      qualified: 2,
      customer: 3,
    };

    return rank[target] >= rank[source] ? target : source;
  }
}
