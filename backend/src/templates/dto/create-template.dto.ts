import { IsEnum, IsString, IsUUID, MinLength, Matches } from 'class-validator';
import { TemplateCategory } from '@prisma/client';

export class CreateTemplateDto {
  @IsUUID()
  whatsappAccountId: string;

  @IsString()
  @MinLength(1)
  @Matches(/^[a-z0-9_]+$/, { message: 'name deve ser lowercase com underscore (ex: lembrete_24h)' })
  name: string;

  @IsEnum(TemplateCategory)
  category: TemplateCategory;

  @IsString()
  @MinLength(2)
  language: string;

  @IsString()
  @MinLength(1)
  body: string;
}
