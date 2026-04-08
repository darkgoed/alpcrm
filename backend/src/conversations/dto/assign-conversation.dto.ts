import { IsUUID, IsOptional } from 'class-validator';

export class AssignConversationDto {
  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsUUID()
  @IsOptional()
  teamId?: string;
}
