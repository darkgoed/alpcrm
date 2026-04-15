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
import { UsersService } from './users.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions, RequireAnyPermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequireAnyPermissions('manage_users', 'manage_workspace')
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findAll(user.workspaceId);
  }

  @Get(':id')
  @RequireAnyPermissions('manage_users', 'manage_workspace')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findOne(id, user.workspaceId);
  }

  @Post()
  @RequirePermissions('manage_users')
  invite(@Body() dto: InviteUserDto, @CurrentUser() user: AuthenticatedUser) {
    return this.usersService.invite(dto, user.workspaceId);
  }

  @Patch(':id')
  @RequirePermissions('manage_users')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.update(id, user.workspaceId, dto);
  }

  @Patch(':id/deactivate')
  @RequirePermissions('manage_users')
  deactivate(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.usersService.deactivate(id, user.workspaceId);
  }

  @Patch(':id/reset-password')
  @RequirePermissions('manage_users')
  resetPassword(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.resetPassword(id, user.workspaceId);
  }

  @Post(':id/roles/:roleId')
  @RequirePermissions('manage_users')
  assignRole(
    @Param('id') id: string,
    @Param('roleId') roleId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.assignRole(id, roleId, user.workspaceId);
  }

  @Delete(':id/roles/:roleId')
  @RequirePermissions('manage_users')
  removeRole(
    @Param('id') id: string,
    @Param('roleId') roleId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.removeRole(id, roleId, user.workspaceId);
  }
}
