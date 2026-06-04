import { Controller, Get, Post, Body, Param, Request, UseGuards, Patch } from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { ChatService } from './chat.service';

@Controller('chats')
@UseGuards(FirebaseAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  async listChats(@Request() req: any) {
    return this.chatService.getChats(req.user.id);
  }

  @Get(':chat_id/messages')
  async getMessages(@Param('chat_id') chatId: string) {
    return this.chatService.getMessages(chatId);
  }

  @Post(':chat_id/messages')
  async postMessage(
    @Param('chat_id') chatId: string,
    @Body() body: { text: string },
    @Request() req: any,
  ) {
    return this.chatService.postMessage(chatId, body.text, req.user.id);
  }

  @Patch(':chat_id/read')
  async markRead(
    @Param('chat_id') chatId: string,
    @Request() req: any,
  ) {
    await this.chatService.markChatAsRead(chatId, req.user.id);
    return { success: true };
  }
}
