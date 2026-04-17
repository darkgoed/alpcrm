import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  ContactFilterDto,
  CreateSavedSegmentDto,
} from './dto/contact.dto';

@Injectable()
export class ContactSegmentsService {
  constructor(private prisma: PrismaService) {}

  async listSavedSegments(workspaceId: string) {
    return this.prisma.savedSegment.findMany({
      where: { workspaceId },
      orderBy: { name: 'asc' },
    });
  }

  async createSavedSegment(workspaceId: string, dto: CreateSavedSegmentDto) {
    const name = dto.name.trim();
    if (!name) {
      throw new BadRequestException('Nome da segmentação é obrigatório');
    }

    const filters = this.normalizeSegmentFilters(dto);

    return this.prisma.savedSegment.upsert({
      where: {
        workspaceId_name: {
          workspaceId,
          name,
        },
      },
      create: {
        workspaceId,
        name,
        filters,
      },
      update: {
        filters,
      },
    });
  }

  async deleteSavedSegment(workspaceId: string, id: string) {
    const segment = await this.prisma.savedSegment.findFirst({
      where: { id, workspaceId },
      select: { id: true },
    });
    if (!segment) throw new NotFoundException('Segmentação não encontrada');
    await this.prisma.savedSegment.delete({ where: { id } });
  }

  buildContactWhere(
    workspaceId: string,
    filters: ContactFilterDto,
  ): Prisma.ContactWhereInput {
    const and: Prisma.ContactWhereInput[] = [{ workspaceId }];

    if (filters.search?.trim()) {
      const q = filters.search.trim();
      and.push({
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q } },
          { email: { contains: q, mode: 'insensitive' } },
          { company: { contains: q, mode: 'insensitive' } },
        ],
      });
    }

    for (const tagId of filters.tagIds ?? []) {
      and.push({ contactTags: { some: { tagId } } });
    }

    if (filters.stageId && filters.pipelineId) {
      and.push({
        contactPipelines: {
          some: { stageId: filters.stageId, pipelineId: filters.pipelineId },
        },
      });
    } else if (filters.stageId) {
      and.push({ contactPipelines: { some: { stageId: filters.stageId } } });
    } else if (filters.pipelineId) {
      and.push({
        contactPipelines: { some: { pipelineId: filters.pipelineId } },
      });
    }

    if (filters.conversationStatus === 'open') {
      and.push({
        conversations: { some: { workspaceId, status: 'open' } },
      });
    } else if (filters.conversationStatus === 'closed') {
      and.push({
        conversations: { some: { workspaceId, status: 'closed' } },
      });
    } else if (filters.conversationStatus === 'none') {
      and.push({
        conversations: { none: { workspaceId } },
      });
    }

    return and.length === 1 ? and[0] : { AND: and };
  }

  private normalizeSegmentFilters(dto: CreateSavedSegmentDto) {
    const filters: Record<string, Prisma.InputJsonValue> = {};

    if (dto.search?.trim()) {
      filters.search = dto.search.trim();
    }

    const tagIds = Array.from(new Set(dto.tagIds ?? [])).filter(Boolean);
    if (tagIds.length > 0) {
      filters.tagIds = tagIds;
    }

    if (dto.pipelineId) {
      filters.pipelineId = dto.pipelineId;
    }

    if (dto.stageId) {
      filters.stageId = dto.stageId;
    }

    if (dto.conversationStatus) {
      filters.conversationStatus = dto.conversationStatus;
    }

    return filters as Prisma.InputJsonObject;
  }
}
