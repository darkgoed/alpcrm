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
import { RequireAnyPermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { InteractiveTemplatesService } from './interactive-templates.service';
import { CreateInteractiveTemplateDto } from './dto/create-interactive-template.dto';
import { UpdateInteractiveTemplateDto } from './dto/update-interactive-template.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequireAnyPermissions('manage_interactive_templates', 'manage_workspace')
@Controller('interactive-templates')
export class InteractiveTemplatesController {
  constructor(private readonly service: InteractiveTemplatesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.service.findAll(user.workspaceId);
  }

  @Post()
  create(
    @Body() dto: CreateInteractiveTemplateDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.create(dto, user.workspaceId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateInteractiveTemplateDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.update(id, user.workspaceId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.remove(id, user.workspaceId);
  }
}
