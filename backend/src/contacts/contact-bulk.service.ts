import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BulkContactActionDto } from './dto/contact.dto';
import { FlowExecutorService } from '../automation/flow-executor.service';

@Injectable()
export class ContactBulkService {
  constructor(
    private prisma: PrismaService,
    private flowExecutor: FlowExecutorService,
  ) {}

  async applyBulkActions(workspaceId: string, dto: BulkContactActionDto) {
    const contactIds = Array.from(new Set(dto.contactIds));
    const addTagIds = Array.from(new Set(dto.addTagIds ?? []));
    const removeTagIds = Array.from(new Set(dto.removeTagIds ?? []));
    const shouldMoveStage = Boolean(dto.pipelineId || dto.stageId);
    const shouldClearOwner = dto.clearOwner === true;
    const shouldUpdateOwner = shouldClearOwner || dto.ownerId !== undefined;
    const shouldUpdateLifecycle = dto.lifecycleStage !== undefined;
    const hasAction =
      addTagIds.length > 0 ||
      removeTagIds.length > 0 ||
      shouldMoveStage ||
      shouldUpdateOwner ||
      shouldUpdateLifecycle;

    if (!hasAction) {
      throw new BadRequestException('Nenhuma ação em lote foi informada');
    }

    if ((dto.pipelineId && !dto.stageId) || (!dto.pipelineId && dto.stageId)) {
      throw new BadRequestException(
        'Pipeline e stage devem ser enviados juntos para mover contatos',
      );
    }

    const contacts = await this.prisma.contact.findMany({
      where: { workspaceId, id: { in: contactIds } },
      include: {
        contactTags: { select: { tagId: true } },
        contactPipelines: { select: { pipelineId: true, stageId: true } },
      },
    });

    if (contacts.length !== contactIds.length) {
      throw new NotFoundException('Um ou mais contatos não foram encontrados');
    }

    const owner =
      shouldUpdateOwner && !shouldClearOwner
        ? await this.findValidOwner(workspaceId, dto.ownerId)
        : null;

    if (addTagIds.length > 0 || removeTagIds.length > 0) {
      const tags = await this.prisma.tag.findMany({
        where: {
          workspaceId,
          id: { in: Array.from(new Set([...addTagIds, ...removeTagIds])) },
        },
        select: { id: true },
      });

      if (tags.length !== new Set([...addTagIds, ...removeTagIds]).size) {
        throw new NotFoundException('Uma ou mais tags não foram encontradas');
      }
    }

    let stage: { id: string; pipelineId: string } | null = null;
    if (shouldMoveStage && dto.pipelineId && dto.stageId) {
      stage = await this.prisma.stage.findFirst({
        where: {
          id: dto.stageId,
          pipelineId: dto.pipelineId,
          pipeline: { workspaceId },
        },
        select: { id: true, pipelineId: true },
      });

      if (!stage) {
        throw new NotFoundException(
          'Stage não encontrado para o pipeline informado',
        );
      }
    }

    const tagInsertRows = addTagIds.flatMap((tagId) =>
      contacts.map((contact) => ({ contactId: contact.id, tagId })),
    );

    const tagPairsToRemove = removeTagIds.flatMap((tagId) =>
      contacts.map((contact) => ({ contactId: contact.id, tagId })),
    );

    const contactsChangingStage =
      stage === null
        ? []
        : contacts.filter((contact) => {
            const current = contact.contactPipelines.find(
              (item) => item.pipelineId === stage.pipelineId,
            );
            return current?.stageId !== stage.id;
          });

    await this.prisma.$transaction(async (tx) => {
      if (shouldUpdateOwner || shouldUpdateLifecycle) {
        const contactData: Prisma.ContactUncheckedUpdateManyInput = {};

        if (shouldUpdateOwner) {
          contactData.ownerId = shouldClearOwner ? null : (owner?.id ?? null);
        }

        if (shouldUpdateLifecycle && dto.lifecycleStage) {
          contactData.lifecycleStage = dto.lifecycleStage;
        }

        await tx.contact.updateMany({
          where: { workspaceId, id: { in: contactIds } },
          data: contactData,
        });
      }

      if (tagInsertRows.length > 0) {
        await tx.contactTag.createMany({
          data: tagInsertRows,
          skipDuplicates: true,
        });
      }

      if (tagPairsToRemove.length > 0) {
        await tx.contactTag.deleteMany({
          where: {
            OR: tagPairsToRemove.map(({ contactId, tagId }) => ({
              contactId,
              tagId,
            })),
          },
        });
      }

      if (stage) {
        for (const contact of contacts) {
          await tx.contactPipeline.upsert({
            where: {
              contactId_pipelineId: {
                contactId: contact.id,
                pipelineId: stage.pipelineId,
              },
            },
            create: {
              contactId: contact.id,
              pipelineId: stage.pipelineId,
              stageId: stage.id,
            },
            update: { stageId: stage.id },
          });
        }
      }
    });

    for (const contact of contacts) {
      const existingTagIds = new Set(
        contact.contactTags.map((item) => item.tagId),
      );
      for (const tagId of addTagIds) {
        if (existingTagIds.has(tagId)) continue;
        await this.flowExecutor.triggerForContactEvent(
          workspaceId,
          contact.id,
          'tag_applied',
          tagId,
        );
      }
    }

    if (stage) {
      for (const contact of contactsChangingStage) {
        await this.flowExecutor.triggerForContactEvent(
          workspaceId,
          contact.id,
          'stage_changed',
          stage.id,
        );
      }
    }

    return {
      updatedContacts: contactIds.length,
      tagsAdded: addTagIds.length * contacts.length,
      tagsRemoved: removeTagIds.length * contacts.length,
      movedToStage: contactsChangingStage.length,
    };
  }

  private async findValidOwner(workspaceId: string, ownerId?: string | null) {
    if (!ownerId) return null;

    const owner = await this.prisma.user.findFirst({
      where: { id: ownerId, workspaceId, isActive: true },
      select: { id: true },
    });
    if (!owner) throw new NotFoundException('Owner do contato não encontrado');
    return owner;
  }
}
