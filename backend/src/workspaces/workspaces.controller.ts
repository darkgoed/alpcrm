import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequireAnyPermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { WorkspacesService } from './workspaces.service';
import { UpdateWorkspaceSettingsDto } from './dto/workspace-settings.dto';
import {
  CreateFollowUpRuleDto,
  UpdateFollowUpRuleDto,
} from './dto/follow-up-rule.dto';
import {
  CreateWhatsappAccountDto,
  RotateWhatsappCredentialsDto,
  TestWhatsappConnectionDto,
  UpdateWhatsappAccountDto,
} from './dto/whatsapp-account.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(private workspacesService: WorkspacesService) {}

  // ─── Configurações ────────────────────────────────────────────────────────────

  @Get('settings')
  @RequireAnyPermissions('manage_workspace_settings', 'manage_workspace')
  getSettings(@CurrentUser() user: AuthenticatedUser) {
    return this.workspacesService.getSettings(user.workspaceId);
  }

  @Patch('settings')
  @RequireAnyPermissions('manage_workspace_settings', 'manage_workspace')
  updateSettings(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateWorkspaceSettingsDto,
  ) {
    return this.workspacesService.updateSettings(user.workspaceId, dto, user.userId);
  }

  // ─── Regras de follow-up ──────────────────────────────────────────────────────

  @Get('follow-up-rules')
  @RequireAnyPermissions('manage_follow_up_rules', 'manage_workspace')
  listFollowUpRules(@CurrentUser() user: AuthenticatedUser) {
    return this.workspacesService.listFollowUpRules(user.workspaceId);
  }

  @Post('follow-up-rules')
  @RequireAnyPermissions('manage_follow_up_rules', 'manage_workspace')
  createFollowUpRule(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateFollowUpRuleDto,
  ) {
    return this.workspacesService.createFollowUpRule(user.workspaceId, dto);
  }

  @Patch('follow-up-rules/:id')
  @RequireAnyPermissions('manage_follow_up_rules', 'manage_workspace')
  updateFollowUpRule(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateFollowUpRuleDto,
  ) {
    return this.workspacesService.updateFollowUpRule(user.workspaceId, id, dto);
  }

  @Delete('follow-up-rules/:id')
  @RequireAnyPermissions('manage_follow_up_rules', 'manage_workspace')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteFollowUpRule(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.workspacesService.deleteFollowUpRule(user.workspaceId, id);
  }

  // ─── Contas WhatsApp ──────────────────────────────────────────────────────────

  @Get('whatsapp-accounts')
  @RequireAnyPermissions('manage_whatsapp_accounts', 'manage_workspace')
  listWhatsappAccounts(@CurrentUser() user: AuthenticatedUser) {
    return this.workspacesService.listWhatsappAccounts(user.workspaceId);
  }

  @Post('whatsapp-accounts')
  @RequireAnyPermissions('manage_whatsapp_accounts', 'manage_workspace')
  createWhatsappAccount(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateWhatsappAccountDto,
  ) {
    return this.workspacesService.createWhatsappAccount(user.workspaceId, dto);
  }

  @Post('whatsapp-accounts/test-connection')
  @RequireAnyPermissions('manage_whatsapp_accounts', 'manage_workspace')
  testWhatsappConnection(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: TestWhatsappConnectionDto,
  ) {
    return this.workspacesService.testWhatsappConnection(user.workspaceId, dto);
  }

  @Patch('whatsapp-accounts/:id')
  @RequireAnyPermissions('manage_whatsapp_accounts', 'manage_workspace')
  updateWhatsappAccount(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateWhatsappAccountDto,
  ) {
    return this.workspacesService.updateWhatsappAccount(
      user.workspaceId,
      id,
      dto,
      user.userId,
    );
  }

  @Post('whatsapp-accounts/:id/rotate-credentials')
  @RequireAnyPermissions('manage_whatsapp_accounts', 'manage_workspace')
  rotateWhatsappCredentials(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RotateWhatsappCredentialsDto,
  ) {
    return this.workspacesService.rotateWhatsappCredentials(
      user.workspaceId,
      id,
      dto,
      user.userId,
    );
  }

  @Delete('whatsapp-accounts/:id')
  @RequireAnyPermissions('manage_whatsapp_accounts', 'manage_workspace')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteWhatsappAccount(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.workspacesService.deleteWhatsappAccount(user.workspaceId, id);
  }

  // ─── Audit Logs ───────────────────────────────────────────────────────────────

  @Get('audit-logs')
  @RequireAnyPermissions('view_audit_logs', 'manage_workspace')
  listAuditLogs(
    @CurrentUser() user: AuthenticatedUser,
    @Query('entity') entity?: string,
    @Query('userId') userId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('take') take?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.workspacesService.listAuditLogs(user.workspaceId, {
      entity,
      userId,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      take: take ? parseInt(take) : 50,
      cursor,
    });
  }
}
