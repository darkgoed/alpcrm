import {
  IsString,
  IsOptional,
  IsEmail,
  IsArray,
  IsUUID,
} from 'class-validator';

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
