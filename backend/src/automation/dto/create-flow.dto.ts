import {
  IsString,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FlowNodeType, FlowTriggerType } from '@prisma/client';

export class CreateFlowNodeDto {
  @IsEnum(FlowNodeType)
  type: FlowNodeType;

  @IsObject()
  config: Record<string, any>;
  // message: { content: string }
  // delay:   { ms: number }
  // condition: { field: string, operator: string, value: string }

  @IsNumber()
  order: number;
}

export class CreateFlowDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(FlowTriggerType)
  triggerType?: FlowTriggerType;

  @IsOptional()
  @IsString()
  triggerValue?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFlowNodeDto)
  nodes?: CreateFlowNodeDto[];
}

export class UpdateFlowDto extends CreateFlowDto {}
