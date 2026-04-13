import { IsString, IsUUID, IsArray, IsOptional } from 'class-validator';

export class InitiateConversationDto {
  @IsUUID()
  contactId: string;

  @IsUUID()
  whatsappAccountId: string;

  @IsUUID()
  templateId: string;

  // Variáveis para substituir {{1}}, {{2}} etc. no corpo do template
  @IsOptional()
  @IsArray()
  variables?: string[];

  @IsOptional()
  @IsArray()
  headerVariables?: string[];

  @IsOptional()
  @IsArray()
  buttonVariables?: string[];

  @IsOptional()
  @IsString()
  headerMediaUrl?: string;
}
