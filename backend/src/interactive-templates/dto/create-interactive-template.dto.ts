import { IsObject, IsString, MinLength } from 'class-validator';

export class CreateInteractiveTemplateDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @MinLength(1)
  content: string;

  @IsString()
  @MinLength(1)
  interactiveType: string;

  @IsObject()
  interactivePayload: Record<string, unknown>;
}
