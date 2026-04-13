import {
  IsString,
  IsOptional,
  IsEmail,
  IsArray,
  IsUUID,
  IsEnum,
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
