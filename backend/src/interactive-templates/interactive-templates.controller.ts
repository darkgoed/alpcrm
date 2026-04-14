import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { InteractiveTemplatesService } from './interactive-templates.service';
import { CreateInteractiveTemplateDto } from './dto/create-interactive-template.dto';
import { UpdateInteractiveTemplateDto } from './dto/update-interactive-template.dto';

interface AuthenticatedUser {
  workspaceId: string;
}

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('interactive-templates')
export class InteractiveTemplatesController {
  constructor(private readonly service: InteractiveTemplatesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.service.findAll(user.workspaceId);
  }

  @Post()
  @RequirePermissions('manage_workspace')
  create(
    @Body() dto: CreateInteractiveTemplateDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.create(dto, user.workspaceId);
  }

  @Patch(':id')
  @RequirePermissions('manage_workspace')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateInteractiveTemplateDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.update(id, user.workspaceId, dto);
  }

  @Delete(':id')
  @RequirePermissions('manage_workspace')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.remove(id, user.workspaceId);
  }
}
