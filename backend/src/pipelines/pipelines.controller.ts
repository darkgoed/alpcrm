import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PipelinesService } from './pipelines.service';
import {
  CreatePipelineDto,
  UpdatePipelineDto,
  CreateStageDto,
  UpdateStageDto,
  ReorderStagesDto,
  MoveContactDto,
} from './dto/pipeline.dto';

@UseGuards(JwtAuthGuard)
@Controller('pipelines')
export class PipelinesController {
  constructor(private pipelinesService: PipelinesService) {}

  // ─── Pipelines ────────────────────────────────────────────────────────────────

  @Get()
  listPipelines(@CurrentUser() user: any) {
    return this.pipelinesService.listPipelines(user.workspaceId);
  }

  @Post()
  createPipeline(@CurrentUser() user: any, @Body() dto: CreatePipelineDto) {
    return this.pipelinesService.createPipeline(user.workspaceId, dto);
  }

  @Patch(':id')
  updatePipeline(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdatePipelineDto) {
    return this.pipelinesService.updatePipeline(user.workspaceId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deletePipeline(@CurrentUser() user: any, @Param('id') id: string) {
    return this.pipelinesService.deletePipeline(user.workspaceId, id);
  }

  // ─── Kanban ───────────────────────────────────────────────────────────────────

  @Get(':id/kanban')
  getKanban(@CurrentUser() user: any, @Param('id') id: string) {
    return this.pipelinesService.getKanban(user.workspaceId, id);
  }

  // ─── Stages ───────────────────────────────────────────────────────────────────

  @Post(':id/stages')
  createStage(@CurrentUser() user: any, @Param('id') pipelineId: string, @Body() dto: CreateStageDto) {
    return this.pipelinesService.createStage(user.workspaceId, pipelineId, dto);
  }

  @Patch(':id/stages/:stageId')
  updateStage(
    @CurrentUser() user: any,
    @Param('id') pipelineId: string,
    @Param('stageId') stageId: string,
    @Body() dto: UpdateStageDto,
  ) {
    return this.pipelinesService.updateStage(user.workspaceId, pipelineId, stageId, dto);
  }

  @Delete(':id/stages/:stageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteStage(
    @CurrentUser() user: any,
    @Param('id') pipelineId: string,
    @Param('stageId') stageId: string,
  ) {
    return this.pipelinesService.deleteStage(user.workspaceId, pipelineId, stageId);
  }

  @Patch(':id/stages/reorder')
  reorderStages(
    @CurrentUser() user: any,
    @Param('id') pipelineId: string,
    @Body() dto: ReorderStagesDto,
  ) {
    return this.pipelinesService.reorderStages(user.workspaceId, pipelineId, dto);
  }

  // ─── Mover contato ────────────────────────────────────────────────────────────

  @Patch(':id/move')
  moveContact(@CurrentUser() user: any, @Param('id') pipelineId: string, @Body() dto: MoveContactDto) {
    return this.pipelinesService.moveContact(user.workspaceId, pipelineId, dto);
  }

  @Delete(':id/contacts/:contactId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeContact(
    @CurrentUser() user: any,
    @Param('id') pipelineId: string,
    @Param('contactId') contactId: string,
  ) {
    return this.pipelinesService.removeContactFromPipeline(user.workspaceId, pipelineId, contactId);
  }
}
