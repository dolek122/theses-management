import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { WebSocketService } from './websocket.service';
import { ChatMessage } from '../models/chat';

export type { ChatMessage } from '../models/chat';

@Injectable({ providedIn: 'root' })
export class ChatService {
  readonly activeThesisId = signal<string | null>(null);

  constructor(private wsService: WebSocketService) {}

  joinThesisChat(thesisId: string): Observable<ChatMessage> {
    return this.wsService.subscribe<ChatMessage>(`/topic/thesis/${thesisId}/chat`);
  }

  sendMessage(thesisId: string, sender: string, content: string) {
    const chatMessage: ChatMessage = {
      content,
      sender,
      thesisId,
      type: 'CHAT'
    };
    this.wsService.publish(`/app/chat/${thesisId}/sendMessage`, chatMessage);
  }

  openChat(thesisId: string) {
    this.activeThesisId.set(thesisId);
  }

  closeChat() {
    this.activeThesisId.set(null);
  }
}
