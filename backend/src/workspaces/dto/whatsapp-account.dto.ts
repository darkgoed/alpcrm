import { IsString, IsBoolean, IsOptional, MinLength } from 'class-validator';

export class CreateWhatsappAccountDto {
  @IsString()
  name: string;

  @IsString()
  phoneNumber: string;

  @IsString()
  metaAccountId: string; // phone_number_id da Meta

  @IsString()
  wabaId: string;

  @IsString()
  @MinLength(10)
  token: string;

  @IsString()
  appSecret: string;

  @IsString()
  verifyToken: string;
}

export class UpdateWhatsappAccountDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  metaAccountId?: string;

  @IsOptional()
  @IsString()
  wabaId?: string;

  @IsOptional()
  @IsString()
  token?: string;

  @IsOptional()
  @IsString()
  appSecret?: string;

  @IsOptional()
  @IsString()
  verifyToken?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class TestWhatsappConnectionDto {
  @IsString()
  phoneNumberId: string;

  @IsString()
  @MinLength(10)
  token: string;
}
