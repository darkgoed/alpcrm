import { IsString, IsOptional, IsArray, IsInt, ValidateNested, IsUUID, IsHexColor, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePipelineDto {
  @IsString()
  name: string;
}

export class UpdatePipelineDto {
  @IsString()
  name: string;
}

export class CreateStageDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsHexColor()
  color?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class UpdateStageDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsHexColor()
  color?: string;
}

export class ReorderStageItem {
  @IsUUID()
  id: string;

  @IsInt()
  @Min(0)
  order: number;
}

export class ReorderStagesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderStageItem)
  stages: ReorderStageItem[];
}

export class MoveContactDto {
  @IsUUID()
  contactId: string;

  @IsUUID()
  stageId: string;
}
