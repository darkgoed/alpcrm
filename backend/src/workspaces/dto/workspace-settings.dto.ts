import { IsInt, IsOptional, Min } from 'class-validator';

export class UpdateWorkspaceSettingsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  autoCloseHours?: number | null;
}
