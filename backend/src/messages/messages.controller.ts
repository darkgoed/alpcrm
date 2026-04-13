import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuid } from 'uuid';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

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

const MEDIA_TYPE_MAP: Record<string, string> = {
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
  search(@CurrentUser() user: any, @Query('q') q: string) {
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
  @RequirePermissions('respond_conversation')
  send(@Body() dto: SendMessageDto, @CurrentUser() user: any) {
    return this.messagesService.send(
      dto,
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
          cb(null, `${uuid()}${extname(file.originalname)}`),
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
    @CurrentUser() user: any,
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
        type: mediaType as any,
        mediaUrl,
        content: caption ?? undefined,
      },
      user.workspaceId,
      user.userId,
      user.permissions,
    );
  }
}
