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
  Request,
} from '@nestjs/common';
import { FlowsService } from './flows.service';
import { CreateFlowDto, UpdateFlowDto } from './dto/create-flow.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('automation/flows')
@UseGuards(JwtAuthGuard)
export class AutomationController {
  constructor(private flows: FlowsService) {}

  @Get()
  findAll(@Request() req: any) {
    return this.flows.findAll(req.user.workspaceId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.flows.findOne(id, req.user.workspaceId);
  }

  @Post()
  create(@Body() dto: CreateFlowDto, @Request() req: any) {
    return this.flows.create(dto, req.user.workspaceId);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateFlowDto,
    @Request() req: any,
  ) {
    return this.flows.update(id, dto, req.user.workspaceId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.flows.remove(id, req.user.workspaceId);
  }

  @Patch(':id/toggle')
  toggle(@Param('id') id: string, @Request() req: any) {
    return this.flows.toggleActive(id, req.user.workspaceId);
  }
}
