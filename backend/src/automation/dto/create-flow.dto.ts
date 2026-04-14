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
  config: Record<string, unknown>;
  // message:          { content: string }
  // delay:            { ms: number }
  // wait_for_reply:   { variableName?: string, timeoutMs?: number }
  // condition/branch: { field: string, operator: string, value: string }
  // tag_contact:      { tagId: string, action: 'add'|'remove' }
  // move_stage:       { stageId: string }
  // assign_to:        { userId?: string, teamId?: string }
  // send_template:    { templateName: string, languageCode?: string, components?: unknown[] }
  // send_interactive: { interactiveType: 'button'|'list', body: string, footer?: string,
  //                     buttons?: [{id,title}], buttonText?: string, sections?: [{title,rows:[{id,title}]}] }
  // webhook_call:     { url: string, method?: string, saveResponseAs?: string }

  @IsNumber()
  order: number;

  @IsOptional()
  @IsString()
  clientId?: string; // id temporário do cliente para referência nos edges
}

export class CreateFlowEdgeDto {
  @IsString()
  fromClientId: string; // clientId do nó de origem

  @IsString()
  toClientId: string; // clientId do nó de destino

  @IsOptional()
  @IsString()
  label?: string; // 'yes' | 'no' | valor de branch | null para edge padrão
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

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFlowEdgeDto)
  edges?: CreateFlowEdgeDto[];
}

export class UpdateFlowDto extends CreateFlowDto {}
