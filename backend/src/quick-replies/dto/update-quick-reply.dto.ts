import { IsString, IsOptional, MinLength } from 'class-validator';

export class UpdateQuickReplyDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  shortcut?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  body?: string;
}
