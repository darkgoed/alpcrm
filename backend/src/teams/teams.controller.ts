import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, UseGuards,
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.teamsService.findAll(user.workspaceId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.teamsService.findOne(id, user.workspaceId);
  }

  @Post()
  @RequirePermissions('manage_teams')
  create(@Body() dto: CreateTeamDto, @CurrentUser() user: any) {
    return this.teamsService.create(dto, user.workspaceId);
  }

  @Patch(':id')
  @RequirePermissions('manage_teams')
  update(@Param('id') id: string, @Body() dto: UpdateTeamDto, @CurrentUser() user: any) {
    return this.teamsService.update(id, user.workspaceId, dto);
  }

  @Delete(':id')
  @RequirePermissions('manage_teams')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.teamsService.remove(id, user.workspaceId);
  }

  @Post(':id/members/:userId')
  @RequirePermissions('manage_teams')
  addMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() user: any,
  ) {
    return this.teamsService.addMember(id, userId, user.workspaceId);
  }

  @Delete(':id/members/:userId')
  @RequirePermissions('manage_teams')
  removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() user: any,
  ) {
    return this.teamsService.removeMember(id, userId, user.workspaceId);
  }
}
