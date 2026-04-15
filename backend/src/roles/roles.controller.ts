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
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions, RequireAnyPermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequireAnyPermissions('manage_roles', 'manage_users', 'manage_workspace')
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.rolesService.findAll(user.workspaceId);
  }

  @Get(':id')
  @RequireAnyPermissions('manage_roles', 'manage_users', 'manage_workspace')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.rolesService.findOne(id, user.workspaceId);
  }

  @Post()
  @RequirePermissions('manage_roles')
  create(@Body() dto: CreateRoleDto, @CurrentUser() user: AuthenticatedUser) {
    return this.rolesService.create(dto, user.workspaceId);
  }

  @Patch(':id/permissions')
  @RequirePermissions('manage_roles')
  updatePermissions(
    @Param('id') id: string,
    @Body() dto: UpdateRolePermissionsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.rolesService.updatePermissions(id, user.workspaceId, dto);
  }

  @Delete(':id')
  @RequirePermissions('manage_roles')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.rolesService.remove(id, user.workspaceId);
  }
}
