import { IsString, MinLength } from 'class-validator';

export class CreateQuickReplyDto {
  @IsString()
  @MinLength(1)
  shortcut: string;

  @IsString()
  @MinLength(1)
  title: string;

  @IsString()
  @MinLength(1)
  body: string;
}
