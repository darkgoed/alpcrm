import {
  IsString,
  IsOptional,
  IsEmail,
  IsArray,
  IsUUID,
  IsEnum,
  IsObject,
  ArrayNotEmpty,
  ArrayUnique,
  IsBoolean,
  IsIn,
} from 'class-validator';

export enum ContactLifecycleStageDto {
  LEAD = 'lead',
  QUALIFIED = 'qualified',
  CUSTOMER = 'customer',
  INACTIVE = 'inactive',
}

export class CreateContactDto {
  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @IsOptional()
  @IsEnum(ContactLifecycleStageDto)
  lifecycleStage?: ContactLifecycleStageDto;

  @IsOptional()
  @IsObject()
  customFields?: Record<string, string>;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];
}

export class UpdateContactDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  company?: string | null;

  @IsOptional()
  @IsUUID()
  ownerId?: string | null;

  @IsOptional()
  @IsEnum(ContactLifecycleStageDto)
  lifecycleStage?: ContactLifecycleStageDto;

  @IsOptional()
  @IsObject()
  customFields?: Record<string, string>;
}

export class AddTagDto {
  @IsUUID()
  tagId: string;
}

export class MergeContactDto {
  @IsUUID()
  targetContactId: string;
}

export class ContactFilterDto {
  tagId?: string;
  tagIds?: string[];
  stageId?: string;
  pipelineId?: string;
  search?: string;
  conversationStatus?: 'open' | 'closed' | 'none';
}

export class CreateSavedSegmentDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayUnique()
  tagIds?: string[];

  @IsOptional()
  @IsUUID()
  pipelineId?: string;

  @IsOptional()
  @IsUUID()
  stageId?: string;

  @IsOptional()
  @IsIn(['open', 'closed', 'none'])
  conversationStatus?: 'open' | 'closed' | 'none';
}

export class SetOptInDto {
  @IsEnum(['opted_in', 'opted_out'])
  status: 'opted_in' | 'opted_out';

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  evidence?: string;
}

export class BulkContactActionDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  @ArrayUnique()
  contactIds: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayUnique()
  addTagIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayUnique()
  removeTagIds?: string[];

  @IsOptional()
  @IsUUID()
  ownerId?: string | null;

  @IsOptional()
  @IsBoolean()
  clearOwner?: boolean;

  @IsOptional()
  @IsEnum(ContactLifecycleStageDto)
  lifecycleStage?: ContactLifecycleStageDto;

  @IsOptional()
  @IsUUID()
  pipelineId?: string;

  @IsOptional()
  @IsUUID()
  stageId?: string;
}
