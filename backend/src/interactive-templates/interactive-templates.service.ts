import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInteractiveTemplateDto } from './dto/create-interactive-template.dto';
import { UpdateInteractiveTemplateDto } from './dto/update-interactive-template.dto';

@Injectable()
export class InteractiveTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(workspaceId: string) {
    return this.prisma.interactiveTemplate.findMany({
      where: { workspaceId },
      orderBy: { name: 'asc' },
    });
  }

  async create(dto: CreateInteractiveTemplateDto, workspaceId: string) {
    await this.ensureNameAvailable(workspaceId, dto.name);

    return this.prisma.interactiveTemplate.create({
      data: {
        workspaceId,
        name: dto.name.trim(),
        content: dto.content.trim(),
        interactiveType: dto.interactiveType.trim(),
        interactivePayload: JSON.parse(
          JSON.stringify(dto.interactivePayload),
        ) as Prisma.InputJsonValue,
      },
    });
  }

  async update(
    id: string,
    workspaceId: string,
    dto: UpdateInteractiveTemplateDto,
  ) {
    const existing = await this.assertExists(id, workspaceId);

    if (dto.name && dto.name.trim() !== existing.name) {
      await this.ensureNameAvailable(workspaceId, dto.name, id);
    }

    return this.prisma.interactiveTemplate.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.content ? { content: dto.content.trim() } : {}),
        ...(dto.interactiveType
          ? { interactiveType: dto.interactiveType.trim() }
          : {}),
        ...(dto.interactivePayload
          ? {
              interactivePayload: JSON.parse(
                JSON.stringify(dto.interactivePayload),
              ) as Prisma.InputJsonValue,
            }
          : {}),
      },
    });
  }

  async remove(id: string, workspaceId: string) {
    await this.assertExists(id, workspaceId);
    return this.prisma.interactiveTemplate.delete({ where: { id } });
  }

  private async assertExists(id: string, workspaceId: string) {
    const template = await this.prisma.interactiveTemplate.findFirst({
      where: { id, workspaceId },
    });

    if (!template) {
      throw new NotFoundException('Template interativo não encontrado');
    }

    return template;
  }

  private async ensureNameAvailable(
    workspaceId: string,
    name: string,
    ignoreId?: string,
  ) {
    const normalizedName = name.trim();
    const existing = await this.prisma.interactiveTemplate.findFirst({
      where: {
        workspaceId,
        name: normalizedName,
        ...(ignoreId ? { id: { not: ignoreId } } : {}),
      },
    });

    if (existing) {
      throw new ConflictException(
        'Já existe um template interativo com esse nome neste workspace',
      );
    }
  }
}
