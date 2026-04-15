import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { QuickRepliesService } from './quick-replies.service';
import { CreateQuickReplyDto } from './dto/create-quick-reply.dto';
import { UpdateQuickReplyDto } from './dto/update-quick-reply.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { RequireAnyPermissions } from '../common/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequireAnyPermissions('manage_quick_replies', 'manage_workspace')
@Controller('quick-replies')
export class QuickRepliesController {
  constructor(private readonly svc: QuickRepliesService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('search') search?: string,
  ) {
    return this.svc.findAll(user.workspaceId, search);
  }

  @Post()
  create(
    @Body() dto: CreateQuickReplyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.svc.create(dto, user.workspaceId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateQuickReplyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.svc.update(id, user.workspaceId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.svc.remove(id, user.workspaceId);
  }
}
