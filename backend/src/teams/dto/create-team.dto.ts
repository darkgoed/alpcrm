import { IsString, IsArray, IsUUID, IsOptional } from 'class-validator';

export class CreateTeamDto {
  @IsString()
  name: string;

  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  userIds?: string[];
}
