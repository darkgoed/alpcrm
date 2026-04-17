import { IsString, Matches, MinLength } from 'class-validator';

export class EnableTwoFactorDto {
  @IsString()
  @Matches(/^\d{6}$/)
  code: string;
}

export class DisableTwoFactorDto {
  @IsString()
  @MinLength(1)
  current_password: string;
}
