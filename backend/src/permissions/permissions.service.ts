import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  // Lista todas as permissões do sistema (para montar o checkbox no frontend)
  findAll() {
    return this.prisma.permission.findMany({ orderBy: { key: 'asc' } });
  }
}
