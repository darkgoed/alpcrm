import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SetOptInDto } from './dto/contact.dto';

@Injectable()
export class ContactNotesService {
  constructor(private prisma: PrismaService) {}

  async listNotes(workspaceId: string, contactId: string) {
    await this.assertContactExists(workspaceId, contactId);
    return this.prisma.contactNote.findMany({
      where: { contactId, workspaceId },
      include: { author: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createNote(
    workspaceId: string,
    contactId: string,
    authorId: string,
    content: string,
  ) {
    await this.assertContactExists(workspaceId, contactId);
    return this.prisma.contactNote.create({
      data: { contactId, workspaceId, authorId, content: content.trim() },
      include: { author: { select: { id: true, name: true } } },
    });
  }

  async setOptIn(workspaceId: string, contactId: string, dto: SetOptInDto) {
    await this.assertContactExists(workspaceId, contactId);
    return this.prisma.contact.update({
      where: { id: contactId },
      data: {
        optInStatus: dto.status,
        optInAt: dto.status === 'opted_in' ? new Date() : undefined,
        optInSource: dto.source ?? null,
        optInEvidence: dto.evidence ?? null,
      },
    });
  }

  async deleteNote(workspaceId: string, contactId: string, noteId: string) {
    const note = await this.prisma.contactNote.findFirst({
      where: { id: noteId, contactId, workspaceId },
    });
    if (!note) throw new NotFoundException('Nota não encontrada');
    await this.prisma.contactNote.delete({ where: { id: noteId } });
  }

  private async assertContactExists(workspaceId: string, contactId: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id: contactId, workspaceId },
      select: { id: true },
    });
    if (!contact) throw new NotFoundException('Contato não encontrado');
  }
}
