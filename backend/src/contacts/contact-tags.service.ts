import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FlowExecutorService } from '../automation/flow-executor.service';

@Injectable()
export class ContactTagsService {
  constructor(
    private prisma: PrismaService,
    private flowExecutor: FlowExecutorService,
  ) {}

  async addTag(workspaceId: string, contactId: string, tagId: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id: contactId, workspaceId },
    });
    if (!contact) throw new NotFoundException('Contato não encontrado');

    const tag = await this.prisma.tag.findFirst({
      where: { id: tagId, workspaceId },
    });
    if (!tag) throw new NotFoundException('Tag não encontrada');

    const existing = await this.prisma.contactTag.findUnique({
      where: { contactId_tagId: { contactId, tagId } },
    });

    await this.prisma.contactTag.upsert({
      where: { contactId_tagId: { contactId, tagId } },
      create: { contactId, tagId },
      update: {},
    });

    if (!existing) {
      await this.flowExecutor.triggerForContactEvent(
        workspaceId,
        contactId,
        'tag_applied',
        tagId,
      );
    }
  }

  async removeTag(workspaceId: string, contactId: string, tagId: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id: contactId, workspaceId },
    });
    if (!contact) throw new NotFoundException('Contato não encontrado');

    await this.prisma.contactTag.deleteMany({ where: { contactId, tagId } });
  }

  async listTags(workspaceId: string) {
    return this.prisma.tag.findMany({
      where: { workspaceId },
      orderBy: { name: 'asc' },
    });
  }

  async createTag(workspaceId: string, name: string, color?: string) {
    const existing = await this.prisma.tag.findUnique({
      where: { workspaceId_name: { workspaceId, name } },
    });
    if (existing) throw new ConflictException('Tag com esse nome já existe');

    return this.prisma.tag.create({
      data: { workspaceId, name, color: color ?? '#6366f1' },
    });
  }

  async deleteTag(workspaceId: string, id: string) {
    const tag = await this.prisma.tag.findFirst({ where: { id, workspaceId } });
    if (!tag) throw new NotFoundException('Tag não encontrada');
    await this.prisma.tag.delete({ where: { id } });
  }
}
