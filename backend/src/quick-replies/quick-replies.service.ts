import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuickReplyDto } from './dto/create-quick-reply.dto';
import { UpdateQuickReplyDto } from './dto/update-quick-reply.dto';

@Injectable()
export class QuickRepliesService {
  constructor(private prisma: PrismaService) {}

  findAll(workspaceId: string, search?: string) {
    return this.prisma.quickReply.findMany({
      where: {
        workspaceId,
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { shortcut: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { shortcut: 'asc' },
    });
  }

  async create(dto: CreateQuickReplyDto, workspaceId: string) {
    const exists = await this.prisma.quickReply.findFirst({
      where: { workspaceId, shortcut: dto.shortcut },
    });
    if (exists) throw new ConflictException('Atalho já existe neste workspace');

    return this.prisma.quickReply.create({
      data: { ...dto, workspaceId },
    });
  }

  async update(id: string, workspaceId: string, dto: UpdateQuickReplyDto) {
    await this.assertExists(id, workspaceId);
    return this.prisma.quickReply.update({ where: { id }, data: dto });
  }

  async remove(id: string, workspaceId: string) {
    await this.assertExists(id, workspaceId);
    return this.prisma.quickReply.delete({ where: { id } });
  }

  private async assertExists(id: string, workspaceId: string) {
    const qr = await this.prisma.quickReply.findFirst({
      where: { id, workspaceId },
    });
    if (!qr) throw new NotFoundException('Resposta rápida não encontrada');
    return qr;
  }
}
