import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { FlowsService } from './flows.service';
import { CreateFlowDto, UpdateFlowDto } from './dto/create-flow.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('automation/flows')
@UseGuards(JwtAuthGuard)
export class AutomationController {
  constructor(private flows: FlowsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.flows.findAll(user.workspaceId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.flows.findOne(id, user.workspaceId);
  }

  @Post()
  create(@Body() dto: CreateFlowDto, @CurrentUser() user: AuthenticatedUser) {
    return this.flows.create(dto, user.workspaceId);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateFlowDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.flows.update(id, dto, user.workspaceId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.flows.remove(id, user.workspaceId);
  }

  @Patch(':id/toggle')
  toggle(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.flows.toggleActive(id, user.workspaceId);
  }
}
