import {
  Controller,
  Get,
  Post,
  Param,
  Patch,
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

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  findAll(
    @CurrentUser() user: any,
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
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
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
    @CurrentUser() user: any,
    @Body() dto: AssignConversationDto,
  ) {
    return this.conversationsService.assign(
      id,
      user.workspaceId,
      dto,
      user.permissions,
    );
  }

  @Patch(':id/close')
  @RequirePermissions('close_conversation')
  close(@Param('id') id: string, @CurrentUser() user: any) {
    return this.conversationsService.close(
      id,
      user.workspaceId,
      user.permissions,
    );
  }

  @Patch(':id/reopen')
  @RequirePermissions('close_conversation')
  reopen(@Param('id') id: string, @CurrentUser() user: any) {
    return this.conversationsService.reopen(
      id,
      user.workspaceId,
      user.permissions,
    );
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @CurrentUser() user: any) {
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
    @CurrentUser() user: any,
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
    @CurrentUser() user: any,
  ) {
    return this.conversationsService.initiateConversation(
      dto,
      user.workspaceId,
      user.userId,
      user.permissions,
    );
  }
}
