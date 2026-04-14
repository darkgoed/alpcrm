import { IsObject, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateInteractiveTemplateDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  content?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  interactiveType?: string;

  @IsOptional()
  @IsObject()
  interactivePayload?: Record<string, unknown>;
}
