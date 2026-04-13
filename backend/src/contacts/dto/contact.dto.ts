import {
  IsString,
  IsOptional,
  IsEmail,
  IsArray,
  IsUUID,
  IsEnum,
  IsObject,
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

export class ContactFilterDto {
  tagId?: string;
  stageId?: string;
  pipelineId?: string;
  search?: string;
}
