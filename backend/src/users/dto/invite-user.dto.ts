import { IsEmail, IsString, MinLength, IsUUID, IsOptional } from 'class-validator';

export class InviteUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsUUID()
  @IsOptional()
  roleId?: string;
}
