import { Injectable, OnModuleInit } from '@nestjs/common';
import * as WebSocket from 'ws';
import { ChatService } from './chat.service';

@Injectable()
export class ChatGateway {
  constructor(private readonly chatService: ChatService) {}

  setupChatWs(server: any) {
    const wss = new WebSocket.Server({ noServer: true });

    wss.on('connection', (ws, request) => {
      const url = request.url || '';
      const urlPath = url.split('?')[0];
      const parts = urlPath.split('/');

      if (urlPath.startsWith('/api/ws/notifications/')) {
        const userId = parts[parts.length - 1];
        this.chatService.registerNotificationClient(userId, ws as any);
        
        ws.on('close', () => {
          this.chatService.removeNotificationClient(userId, ws as any);
        });
        return;
      }

      if (urlPath.startsWith('/api/ws/chat/')) {
        const chatParts = urlPath.replace('/api/ws/chat/', '').split('/');
        const chatId = chatParts[0];
        const userId = chatParts[1] || null;
        this.chatService.registerChatClient(chatId, userId, ws as any);

        ws.on('close', () => {
          this.chatService.removeChatClient(chatId, userId, ws as any);
        });
        return;
      }
    });

    server.on('upgrade', (request: any, socket: any, head: any) => {
      if (request.url?.startsWith('/api/ws/chat/') || request.url?.startsWith('/api/ws/notifications/')) {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      }
    });
  }
}
