import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { TemplateCategory } from '@prisma/client';

const TEMPLATE_HEADER_FORMATS = ['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT'] as const;
const TEMPLATE_BUTTON_TYPES = ['QUICK_REPLY', 'URL', 'PHONE_NUMBER'] as const;

export class TemplateVariableExamplesDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  headerText?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  bodyText?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  buttonText?: string[];
}

export class CreateTemplateButtonDto {
  @IsIn(TEMPLATE_BUTTON_TYPES)
  type: (typeof TEMPLATE_BUTTON_TYPES)[number];

  @IsString()
  @MinLength(1)
  text: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;
}

export class CreateTemplateDto {
  @IsUUID()
  whatsappAccountId: string;

  @IsString()
  @MinLength(1)
  @Matches(/^[a-z0-9_]+$/, {
    message: 'name deve ser lowercase com underscore (ex: lembrete_24h)',
  })
  name: string;

  @IsEnum(TemplateCategory)
  category: TemplateCategory;

  @IsString()
  @MinLength(2)
  language: string;

  @IsOptional()
  @IsIn(TEMPLATE_HEADER_FORMATS)
  headerFormat?: (typeof TEMPLATE_HEADER_FORMATS)[number];

  @IsOptional()
  @IsString()
  @MinLength(1)
  headerText?: string;

  @IsString()
  @MinLength(1)
  body: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  headerMediaHandle?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  footerText?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => CreateTemplateButtonDto)
  buttons?: CreateTemplateButtonDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => TemplateVariableExamplesDto)
  variableExamples?: TemplateVariableExamplesDto;
}
