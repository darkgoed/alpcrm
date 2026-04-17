import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

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

  @IsOptional()
  @IsString()
  smtpHost?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  smtpPort?: number | null;

  @IsOptional()
  @IsBoolean()
  smtpSecure?: boolean;

  @IsOptional()
  @IsString()
  smtpUser?: string | null;

  @IsOptional()
  @IsString()
  smtpPassword?: string | null;

  @IsOptional()
  @IsString()
  smtpFromName?: string | null;

  @IsOptional()
  @IsEmail()
  smtpFromEmail?: string | null;
}

export class TestWorkspaceSmtpDto {
  @IsOptional()
  @IsString()
  smtpHost?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  smtpPort?: number | null;

  @IsOptional()
  @IsBoolean()
  smtpSecure?: boolean;

  @IsOptional()
  @IsString()
  smtpUser?: string | null;

  @IsOptional()
  @IsString()
  smtpPassword?: string | null;

  @IsOptional()
  @IsString()
  smtpFromName?: string | null;

  @IsOptional()
  @IsEmail()
  smtpFromEmail?: string | null;
}
