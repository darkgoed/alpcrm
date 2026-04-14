import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { extname, join } from 'path';
import { MessageType } from '@prisma/client';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'audio/ogg',
  'audio/mpeg',
  'audio/mp4',
  'video/mp4',
  'video/3gpp',
]);

const MEDIA_TYPE_MAP: Record<string, MessageType> = {
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
  'image/gif': 'image',
  'application/pdf': 'document',
  'audio/ogg': 'audio',
  'audio/mpeg': 'audio',
  'audio/mp4': 'audio',
  'video/mp4': 'video',
  'video/3gpp': 'video',
};

const uploadsDir = join(process.cwd(), 'uploads');

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('search')
  search(@CurrentUser() user: AuthenticatedUser, @Query('q') q: string) {
    if (!q?.trim()) throw new BadRequestException('Parâmetro q é obrigatório');
    return this.messagesService.search(
      q,
      user.workspaceId,
      user.userId,
      user.permissions,
    );
  }

  @Get()
  findByConversation(
    @CurrentUser() user: AuthenticatedUser,
    @Query('conversationId') conversationId: string,
    @Query('cursor') cursor?: string,
    @Query('take') take?: string,
  ) {
    const parsedTake = Number.parseInt(take ?? '', 10);
    return this.messagesService.findByConversation(
      conversationId,
      user.workspaceId,
      user.userId,
      user.permissions,
      cursor,
      Number.isNaN(parsedTake) ? 30 : parsedTake,
    );
  }

  @Post()
  @RequirePermissions('respond_conversation')
  send(@Body() dto: SendMessageDto, @CurrentUser() user: AuthenticatedUser) {
    return this.messagesService.send(
      dto,
      user.workspaceId,
      user.userId,
      user.permissions,
    );
  }

  @Post(':id/reactions')
  @RequirePermissions('respond_conversation')
  react(
    @Param('id') id: string,
    @Body('emoji') emoji: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!emoji?.trim()) {
      throw new BadRequestException('Emoji obrigatorio');
    }

    return this.messagesService.react(
      id,
      emoji,
      user.workspaceId,
      user.userId,
      user.permissions,
    );
  }

  @Delete(':id')
  @RequirePermissions('respond_conversation')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.messagesService.remove(
      id,
      user.workspaceId,
      user.userId,
      user.permissions,
    );
  }

  @Post('media')
  @RequirePermissions('respond_conversation')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadsDir,
        filename: (_req, file, cb) =>
          cb(null, `${randomUUID()}${extname(file.originalname)}`),
      }),
      limits: { fileSize: 16 * 1024 * 1024 }, // 16 MB
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME.has(file.mimetype)) cb(null, true);
        else
          cb(new BadRequestException('Tipo de arquivo não suportado'), false);
      },
    }),
  )
  sendMedia(
    @UploadedFile() file: Express.Multer.File,
    @Body('conversationId') conversationId: string,
    @Body('caption') caption: string | undefined,
    @Body('replyToMessageId') replyToMessageId: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!file) throw new BadRequestException('Arquivo obrigatório');
    if (!conversationId)
      throw new BadRequestException('conversationId obrigatório');

    const mediaType = MEDIA_TYPE_MAP[file.mimetype] ?? 'document';
    const apiBase =
      process.env.API_BASE_URL ??
      `http://localhost:${process.env.PORT ?? 3000}`;
    const mediaUrl = `${apiBase}/api/uploads/${file.filename}`;

    return this.messagesService.send(
      {
        conversationId,
        type: mediaType,
        mediaUrl,
        content: caption ?? undefined,
        replyToMessageId: replyToMessageId ?? undefined,
      },
      user.workspaceId,
      user.userId,
      user.permissions,
    );
  }
}
