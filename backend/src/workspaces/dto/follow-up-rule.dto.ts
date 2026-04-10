import { IsString, IsInt, IsOptional, IsBoolean, Min, MinLength } from 'class-validator';

export class CreateFollowUpRuleDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @MinLength(1)
  message: string;

  @IsInt()
  @Min(1)
  delayHours: number;
}

export class UpdateFollowUpRuleDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  message?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  delayHours?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
