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
import {
  CreateContactDto,
  UpdateContactDto,
  AddTagDto,
  BulkContactActionDto,
  CreateSavedSegmentDto,
  MergeContactDto,
} from './dto/contact.dto';

@UseGuards(JwtAuthGuard)
@Controller('contacts')
export class ContactsController {
  constructor(private contactsService: ContactsService) {}

  // ─── Contatos ─────────────────────────────────────────────────────────────────

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('tagIds') tagIds?: string | string[],
    @Query('stageId') stageId?: string,
    @Query('pipelineId') pipelineId?: string,
    @Query('conversationStatus')
    conversationStatus?: 'open' | 'closed' | 'none',
  ) {
    return this.contactsService.findAll(user.workspaceId, {
      search,
      tagIds: this.parseListQuery(tagIds),
      stageId,
      pipelineId,
      conversationStatus,
    });
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
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateContactDto,
  ) {
    return this.contactsService.update(user.workspaceId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.contactsService.remove(user.workspaceId, id);
  }

  @Post(':id/merge')
  merge(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: MergeContactDto,
  ) {
    return this.contactsService.merge(
      user.workspaceId,
      id,
      dto.targetContactId,
    );
  }

  // ─── Importação CSV ───────────────────────────────────────────────────────────

  @Post('import/preview')
  @UseInterceptors(FileInterceptor('file'))
  async importPreview(@CurrentUser() user: any, @UploadedFile() file: any) {
    if (!file?.buffer) throw new BadRequestException('Arquivo CSV obrigatório');
    return this.contactsService.previewImport(
      user.workspaceId,
      file.buffer as Buffer,
    );
  }

  @Post('import/confirm')
  async importConfirm(
    @CurrentUser() user: any,
    @Body()
    dto: { rows: Array<{ phone: string; name?: string; email?: string }> },
  ) {
    return this.contactsService.queueImport(user.workspaceId, dto.rows ?? []);
  }

  // ─── Tags por contato ─────────────────────────────────────────────────────────

  @Post(':id/tags')
  addTag(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: AddTagDto,
  ) {
    return this.contactsService.addTag(user.workspaceId, id, dto.tagId);
  }

  @Delete(':id/tags/:tagId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeTag(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('tagId') tagId: string,
  ) {
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

  @Get('/segments')
  listSegments(@CurrentUser() user: any) {
    return this.contactsService.listSavedSegments(user.workspaceId);
  }

  @Post('/segments')
  createSegment(@CurrentUser() user: any, @Body() dto: CreateSavedSegmentDto) {
    return this.contactsService.createSavedSegment(user.workspaceId, dto);
  }

  @Delete('/segments/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteSegment(@CurrentUser() user: any, @Param('id') id: string) {
    return this.contactsService.deleteSavedSegment(user.workspaceId, id);
  }

  @Post('/bulk/actions')
  bulkActions(@CurrentUser() user: any, @Body() dto: BulkContactActionDto) {
    return this.contactsService.applyBulkActions(user.workspaceId, dto);
  }

  // ─── Notas internas ───────────────────────────────────────────────────────────

  @Get(':id/notes')
  listNotes(@CurrentUser() user: any, @Param('id') id: string) {
    return this.contactsService.listNotes(user.workspaceId, id);
  }

  @Post(':id/notes')
  createNote(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('content') content: string,
  ) {
    return this.contactsService.createNote(
      user.workspaceId,
      id,
      user.sub,
      content,
    );
  }

  @Delete(':id/notes/:noteId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteNote(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('noteId') noteId: string,
  ) {
    return this.contactsService.deleteNote(user.workspaceId, id, noteId);
  }

  private parseListQuery(value?: string | string[]) {
    if (!value) return undefined;
    const items = Array.isArray(value) ? value : value.split(',');
    const parsed = items.map((item) => item.trim()).filter(Boolean);
    return parsed.length > 0 ? parsed : undefined;
  }
}
