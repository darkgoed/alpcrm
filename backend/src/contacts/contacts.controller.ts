import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ContactsService } from './contacts.service';
import { CreateContactDto, UpdateContactDto, AddTagDto } from './dto/contact.dto';

@UseGuards(JwtAuthGuard)
@Controller('contacts')
export class ContactsController {
  constructor(private contactsService: ContactsService) {}

  // ─── Contatos ─────────────────────────────────────────────────────────────────

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('tagId') tagId?: string,
    @Query('stageId') stageId?: string,
    @Query('pipelineId') pipelineId?: string,
  ) {
    return this.contactsService.findAll(user.workspaceId, { search, tagId, stageId, pipelineId });
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.contactsService.findOne(user.workspaceId, id);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateContactDto) {
    return this.contactsService.create(user.workspaceId, dto);
  }

  @Patch(':id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateContactDto) {
    return this.contactsService.update(user.workspaceId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.contactsService.remove(user.workspaceId, id);
  }

  // ─── Importação CSV ───────────────────────────────────────────────────────────

  @Post('import/preview')
  @UseInterceptors(FileInterceptor('file'))
  async importPreview(@CurrentUser() user: any, @UploadedFile() file: any) {
    if (!file?.buffer) throw new BadRequestException('Arquivo CSV obrigatório');
    return this.contactsService.previewImport(user.workspaceId, file.buffer as Buffer);
  }

  @Post('import/confirm')
  async importConfirm(
    @CurrentUser() user: any,
    @Body() dto: { rows: Array<{ phone: string; name?: string; email?: string }> },
  ) {
    return this.contactsService.queueImport(user.workspaceId, dto.rows ?? []);
  }

  // ─── Tags por contato ─────────────────────────────────────────────────────────

  @Post(':id/tags')
  addTag(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: AddTagDto) {
    return this.contactsService.addTag(user.workspaceId, id, dto.tagId);
  }

  @Delete(':id/tags/:tagId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeTag(@CurrentUser() user: any, @Param('id') id: string, @Param('tagId') tagId: string) {
    return this.contactsService.removeTag(user.workspaceId, id, tagId);
  }

  // ─── Tags do workspace ────────────────────────────────────────────────────────

  @Get('/tags/list')
  listTags(@CurrentUser() user: any) {
    return this.contactsService.listTags(user.workspaceId);
  }

  @Post('/tags/create')
  createTag(
    @CurrentUser() user: any,
    @Body('name') name: string,
    @Body('color') color?: string,
  ) {
    return this.contactsService.createTag(user.workspaceId, name, color);
  }

  @Delete('/tags/:tagId/delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteTag(@CurrentUser() user: any, @Param('tagId') tagId: string) {
    return this.contactsService.deleteTag(user.workspaceId, tagId);
  }
}
