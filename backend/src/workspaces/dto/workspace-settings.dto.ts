import { IsInt, IsOptional, IsString, Min, IsObject } from 'class-validator';

export class UpdateWorkspaceSettingsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  autoCloseHours?: number | null;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string | null;

  @IsOptional()
  @IsObject()
  businessHours?: Record<
    string,
    { enabled: boolean; open: string; close: string }
  > | null;

  @IsOptional()
  @IsString()
  outOfHoursMessage?: string | null;
}
