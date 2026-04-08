import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, UseGuards,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.rolesService.findAll(user.workspaceId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.rolesService.findOne(id, user.workspaceId);
  }

  @Post()
  @RequirePermissions('manage_roles')
  create(@Body() dto: CreateRoleDto, @CurrentUser() user: any) {
    return this.rolesService.create(dto, user.workspaceId);
  }

  @Patch(':id/permissions')
  @RequirePermissions('manage_roles')
  updatePermissions(
    @Param('id') id: string,
    @Body() dto: UpdateRolePermissionsDto,
    @CurrentUser() user: any,
  ) {
    return this.rolesService.updatePermissions(id, user.workspaceId, dto);
  }

  @Delete(':id')
  @RequirePermissions('manage_roles')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.rolesService.remove(id, user.workspaceId);
  }
}
