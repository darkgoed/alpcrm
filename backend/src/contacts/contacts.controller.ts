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
import type { Express } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { ContactsService } from './contacts.service';
import { ContactImportService } from './contact-import.service';
import { ContactBulkService } from './contact-bulk.service';
import { ContactNotesService } from './contact-notes.service';
import { ContactTagsService } from './contact-tags.service';
import { ContactSegmentsService } from './contact-segments.service';
import {
  CreateContactDto,
  UpdateContactDto,
  AddTagDto,
  BulkContactActionDto,
  CreateSavedSegmentDto,
  MergeContactDto,
  SetOptInDto,
} from './dto/contact.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('contacts')
export class ContactsController {
  constructor(
    private contactsService: ContactsService,
    private contactImportService: ContactImportService,
    private contactBulkService: ContactBulkService,
    private contactNotesService: ContactNotesService,
    private contactTagsService: ContactTagsService,
    private contactSegmentsService: ContactSegmentsService,
  ) {}

  // ─── Contatos ─────────────────────────────────────────────────────────────────

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
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
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Query('includeMessages') includeMessages?: string,
  ) {
    return this.contactsService.findOne(
      user.workspaceId,
      id,
      includeMessages !== 'false',
    );
  }

  @Post()
  @RequirePermissions('manage_contacts')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateContactDto,
  ) {
    return this.contactsService.create(user.workspaceId, dto);
  }

  @Patch(':id')
  @RequirePermissions('manage_contacts')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateContactDto,
  ) {
    return this.contactsService.update(user.workspaceId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('manage_contacts')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.contactsService.remove(user.workspaceId, id);
  }

  @Post(':id/merge')
  @RequirePermissions('manage_contacts')
  merge(
    @CurrentUser() user: AuthenticatedUser,
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
  @RequirePermissions('manage_contacts')
  @UseInterceptors(FileInterceptor('file'))
  async importPreview(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file?.buffer) throw new BadRequestException('Arquivo CSV obrigatório');
    return this.contactImportService.previewImport(
      user.workspaceId,
      file.buffer,
    );
  }

  @Post('import/confirm')
  @RequirePermissions('manage_contacts')
  async importConfirm(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    dto: { rows: Array<{ phone: string; name?: string; email?: string }> },
  ) {
    return this.contactImportService.queueImport(
      user.workspaceId,
      dto.rows ?? [],
    );
  }

  // ─── Tags por contato ─────────────────────────────────────────────────────────

  @Post(':id/tags')
  addTag(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: AddTagDto,
  ) {
    return this.contactTagsService.addTag(user.workspaceId, id, dto.tagId);
  }

  @Delete(':id/tags/:tagId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeTag(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('tagId') tagId: string,
  ) {
    return this.contactTagsService.removeTag(user.workspaceId, id, tagId);
  }

  // ─── Tags do workspace ────────────────────────────────────────────────────────

  @Get('/tags/list')
  listTags(@CurrentUser() user: AuthenticatedUser) {
    return this.contactTagsService.listTags(user.workspaceId);
  }

  @Post('/tags/create')
  @RequirePermissions('manage_contacts')
  createTag(
    @CurrentUser() user: AuthenticatedUser,
    @Body('name') name: string,
    @Body('color') color?: string,
  ) {
    return this.contactTagsService.createTag(user.workspaceId, name, color);
  }

  @Delete('/tags/:tagId/delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('manage_contacts')
  deleteTag(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tagId') tagId: string,
  ) {
    return this.contactTagsService.deleteTag(user.workspaceId, tagId);
  }

  @Get('/segments')
  listSegments(@CurrentUser() user: AuthenticatedUser) {
    return this.contactSegmentsService.listSavedSegments(user.workspaceId);
  }

  @Post('/segments')
  createSegment(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSavedSegmentDto,
  ) {
    return this.contactSegmentsService.createSavedSegment(
      user.workspaceId,
      dto,
    );
  }

  @Delete('/segments/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteSegment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.contactSegmentsService.deleteSavedSegment(
      user.workspaceId,
      id,
    );
  }

  @Post('/bulk/actions')
  @RequirePermissions('manage_contacts')
  bulkActions(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: BulkContactActionDto,
  ) {
    return this.contactBulkService.applyBulkActions(user.workspaceId, dto);
  }

  // ─── Notas internas ───────────────────────────────────────────────────────────

  @Get(':id/notes')
  listNotes(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.contactNotesService.listNotes(user.workspaceId, id);
  }

  @Post(':id/notes')
  createNote(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body('content') content: string,
  ) {
    return this.contactNotesService.createNote(
      user.workspaceId,
      id,
      user.userId,
      content,
    );
  }

  @Patch(':id/opt-in')
  @RequirePermissions('manage_contacts')
  setOptIn(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: SetOptInDto,
  ) {
    return this.contactNotesService.setOptIn(user.workspaceId, id, dto);
  }

  @Delete(':id/notes/:noteId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteNote(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('noteId') noteId: string,
  ) {
    return this.contactNotesService.deleteNote(user.workspaceId, id, noteId);
  }

  private parseListQuery(value?: string | string[]) {
    if (!value) return undefined;
    const items = Array.isArray(value) ? value : value.split(',');
    const parsed = items.map((item) => item.trim()).filter(Boolean);
    return parsed.length > 0 ? parsed : undefined;
  }
}
