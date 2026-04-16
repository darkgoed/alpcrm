import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import {
  RequirePermissions,
  RequireAnyPermissions,
} from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  @RequireAnyPermissions(
    'manage_teams',
    'assign_conversation',
    'manage_workspace',
  )
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.teamsService.findAll(user.workspaceId);
  }

  @Get(':id')
  @RequireAnyPermissions(
    'manage_teams',
    'assign_conversation',
    'manage_workspace',
  )
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.teamsService.findOne(id, user.workspaceId);
  }

  @Post()
  @RequirePermissions('manage_teams')
  create(@Body() dto: CreateTeamDto, @CurrentUser() user: AuthenticatedUser) {
    return this.teamsService.create(dto, user.workspaceId, user.userId);
  }

  @Patch(':id')
  @RequirePermissions('manage_teams')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTeamDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.teamsService.update(id, user.workspaceId, dto, user.userId);
  }

  @Delete(':id')
  @RequirePermissions('manage_teams')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.teamsService.remove(id, user.workspaceId, user.userId);
  }

  @Post(':id/members/:userId')
  @RequirePermissions('manage_teams')
  addMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.teamsService.addMember(id, userId, user.workspaceId, user.userId);
  }

  @Delete(':id/members/:userId')
  @RequirePermissions('manage_teams')
  removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.teamsService.removeMember(id, userId, user.workspaceId, user.userId);
  }
}
