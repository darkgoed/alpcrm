import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { WorkspacesService } from './workspaces.service';
import { UpdateWorkspaceSettingsDto } from './dto/workspace-settings.dto';
import { CreateFollowUpRuleDto, UpdateFollowUpRuleDto } from './dto/follow-up-rule.dto';
import { CreateWhatsappAccountDto, UpdateWhatsappAccountDto } from './dto/whatsapp-account.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(private workspacesService: WorkspacesService) {}

  // ─── Configurações ────────────────────────────────────────────────────────────

  @Get('settings')
  @RequirePermissions('manage_workspace')
  getSettings(@CurrentUser() user: any) {
    return this.workspacesService.getSettings(user.workspaceId);
  }

  @Patch('settings')
  @RequirePermissions('manage_workspace')
  updateSettings(@CurrentUser() user: any, @Body() dto: UpdateWorkspaceSettingsDto) {
    return this.workspacesService.updateSettings(user.workspaceId, dto);
  }

  // ─── Regras de follow-up ──────────────────────────────────────────────────────

  @Get('follow-up-rules')
  @RequirePermissions('manage_workspace')
  listFollowUpRules(@CurrentUser() user: any) {
    return this.workspacesService.listFollowUpRules(user.workspaceId);
  }

  @Post('follow-up-rules')
  @RequirePermissions('manage_workspace')
  createFollowUpRule(@CurrentUser() user: any, @Body() dto: CreateFollowUpRuleDto) {
    return this.workspacesService.createFollowUpRule(user.workspaceId, dto);
  }

  @Patch('follow-up-rules/:id')
  @RequirePermissions('manage_workspace')
  updateFollowUpRule(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateFollowUpRuleDto,
  ) {
    return this.workspacesService.updateFollowUpRule(user.workspaceId, id, dto);
  }

  @Delete('follow-up-rules/:id')
  @RequirePermissions('manage_workspace')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteFollowUpRule(@CurrentUser() user: any, @Param('id') id: string) {
    return this.workspacesService.deleteFollowUpRule(user.workspaceId, id);
  }

  // ─── Contas WhatsApp ──────────────────────────────────────────────────────────

  @Get('whatsapp-accounts')
  @RequirePermissions('manage_workspace')
  listWhatsappAccounts(@CurrentUser() user: any) {
    return this.workspacesService.listWhatsappAccounts(user.workspaceId);
  }

  @Post('whatsapp-accounts')
  @RequirePermissions('manage_workspace')
  createWhatsappAccount(@CurrentUser() user: any, @Body() dto: CreateWhatsappAccountDto) {
    return this.workspacesService.createWhatsappAccount(user.workspaceId, dto);
  }

  @Patch('whatsapp-accounts/:id')
  @RequirePermissions('manage_workspace')
  updateWhatsappAccount(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateWhatsappAccountDto,
  ) {
    return this.workspacesService.updateWhatsappAccount(user.workspaceId, id, dto);
  }

  @Delete('whatsapp-accounts/:id')
  @RequirePermissions('manage_workspace')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteWhatsappAccount(@CurrentUser() user: any, @Param('id') id: string) {
    return this.workspacesService.deleteWhatsappAccount(user.workspaceId, id);
  }
}
