import {
  IsString,
  IsUUID,
  IsOptional,
  IsEnum,
  IsObject,
} from 'class-validator';
import { MessageType } from '@prisma/client';

export class SendMessageDto {
  @IsUUID()
  conversationId: string;

  @IsEnum(MessageType)
  @IsOptional()
  type?: MessageType;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  mediaUrl?: string;

  @IsString()
  @IsOptional()
  interactiveType?: string;

  @IsObject()
  @IsOptional()
  interactivePayload?: Record<string, any>;
}
