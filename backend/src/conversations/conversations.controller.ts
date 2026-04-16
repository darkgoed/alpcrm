import {
  Controller,
  Get,
  Post,
  Param,
  Patch,
  Delete,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { AssignConversationDto } from './dto/assign-conversation.dto';
import { InitiateConversationDto } from './dto/initiate-conversation.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ConversationStatus } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: ConversationStatus,
    @Query('teamId') teamId?: string,
    @Query('assignedUserId') assignedUserId?: string,
  ) {
    return this.conversationsService.findAll(
      user.workspaceId,
      user.userId,
      user.permissions,
      { status, teamId, assignedUserId },
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.conversationsService.findOne(
      id,
      user.workspaceId,
      user.userId,
      user.permissions,
    );
  }

  @Patch(':id/assign')
  @RequirePermissions('assign_conversation')
  assign(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AssignConversationDto,
  ) {
    return this.conversationsService.assign(
      id,
      user.workspaceId,
      dto,
      user.permissions,
      user.userId,
    );
  }

  @Patch(':id/close')
  @RequirePermissions('close_conversation')
  close(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.conversationsService.close(
      id,
      user.workspaceId,
      user.permissions,
      user.userId,
    );
  }

  @Patch(':id/reopen')
  @RequirePermissions('close_conversation')
  reopen(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.conversationsService.reopen(
      id,
      user.workspaceId,
      user.permissions,
      user.userId,
    );
  }

  @Delete(':id')
  @RequirePermissions('close_conversation')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.conversationsService.remove(
      id,
      user.workspaceId,
      user.permissions,
    );
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.conversationsService.markAsRead(
      id,
      user.workspaceId,
      user.userId,
      user.permissions,
    );
  }

  @Post(':id/notes')
  @RequirePermissions('manage_internal_notes')
  addNote(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body('content') content: string,
  ) {
    return this.conversationsService.addNote(
      id,
      user.workspaceId,
      user.userId,
      content,
      user.permissions,
    );
  }

  @Post('initiate')
  @RequirePermissions('initiate_outbound_conversation')
  initiateConversation(
    @Body() dto: InitiateConversationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.conversationsService.initiateConversation(
      dto,
      user.workspaceId,
      user.userId,
      user.permissions,
    );
  }
}
