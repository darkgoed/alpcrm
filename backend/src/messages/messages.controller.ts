import { Controller, Get, Post, Body, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('search')
  search(
    @CurrentUser() user: any,
    @Query('q') q: string,
  ) {
    if (!q?.trim()) throw new BadRequestException('Parâmetro q é obrigatório');
    return this.messagesService.search(q, user.workspaceId, user.userId, user.permissions);
  }

  @Get()
  findByConversation(
    @CurrentUser() user: any,
    @Query('conversationId') conversationId: string,
    @Query('cursor') cursor?: string,
    @Query('take') take?: string,
  ) {
    return this.messagesService.findByConversation(
      conversationId,
      user.workspaceId,
      user.userId,
      user.permissions,
      cursor,
      take ? parseInt(take) : 50,
    );
  }

  @Post()
  send(@Body() dto: SendMessageDto, @CurrentUser() user: any) {
    return this.messagesService.send(dto, user.workspaceId, user.userId, user.permissions);
  }
}
