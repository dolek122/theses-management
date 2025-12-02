import {
  Component,
  OnInit,
  Input,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  ChangeDetectorRef,
  ChangeDetectionStrategy
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { ChatService, ChatMessage } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { WebSocketService } from '../../services/websocket.service';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="chat-container" [class.collapsed]="collapsed">
      <div class="chat-header" (click)="toggleCollapse()">
        <div class="header-content">
          <mat-icon>chat</mat-icon>
          <span>Czat pracy</span>

          <span 
            class="status-indicator"
            [class.online]="isConnected"
            [title]="isConnected ? 'Połączono' : 'Rozłączono'">
          </span>

          <span *ngIf="!collapsed" class="header-id">
            ID: {{ thesisId | slice:0:4 }}...
          </span>
        </div>
        <mat-icon>{{ collapsed ? 'expand_less' : 'expand_more' }}</mat-icon>
      </div>

      <div class="chat-body" #scrollMe>
        <div *ngIf="messages.length === 0" class="empty-state">
          Brak wiadomości. Rozpocznij rozmowę!
        </div>

        <div 
          *ngFor="let msg of messages; trackBy: trackByMessage"
          class="message"
          [class.my-message]="isMyMessage(msg)">
        
          <div class="message-sender">
            {{ msg.sender }}
            <span *ngIf="msg.timestamp" class="message-time">
              {{ msg.timestamp | date:'shortTime' }}
            </span>
          </div>

          <div class="message-content">
            {{ msg.content }}
          </div>
        </div>
      </div>

      <div class="chat-footer">
        <input
          [(ngModel)]="newMessage"
          (keyup.enter)="sendMessage()"
          placeholder="Wpisz wiadomość..."
          [disabled]="!isConnected"
        />

        <button 
          mat-icon-button 
          color="primary"
          (click)="sendMessage()"
          [disabled]="!newMessage.trim() || !isConnected">
          <mat-icon>send</mat-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .chat-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 320px;
      background: white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      border-radius: 12px 12px 0 0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      z-index: 1000;
      border: 1px solid #e0e0e0;
      max-height: 420px;
      transition: max-height 0.3s ease;
    }
    .chat-container.collapsed {
      max-height: 48px;
    }
    .chat-header {
      background: var(--primary-600, #3f51b5);
      color: white;
      padding: 12px 16px;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 500;
    }
    .header-content {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .header-id {
      font-size: 0.7em;
      margin-left: 8px;
      opacity: 0.75;
    }
    .status-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #bdbdbd;
    }
    .status-indicator.online {
      background-color: #4caf50;
    }
    .chat-body {
      height: 350px;
      overflow-y: auto;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      background: #f5f5f5;
    }
    .empty-state {
      text-align: center;
      color: #757575;
      margin-top: 20px;
      font-size: 0.9em;
    }
    .message {
      max-width: 85%;
      padding: 8px 12px;
      border-radius: 12px;
      font-size: 14px;
      align-self: flex-start;
      background: white;
      border: 1px solid #e0e0e0;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
    .my-message {
      align-self: flex-end;
      background: #e3f2fd;
      border-color: #bbdefb;
    }
    .message-sender {
      font-size: 10px;
      color: #757575;
      margin-bottom: 4px;
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 8px;
    }
    .chat-footer {
      padding: 8px;
      display: flex;
      align-items: center;
      border-top: 1px solid #e0e0e0;
      background: white;
      gap: 8px;
    }
    .chat-footer input {
      flex: 1;
      border: 1px solid #e0e0e0;
      border-radius: 20px;
      outline: none;
      padding: 8px 12px;
      font-size: 14px;
    }
    .chat-footer input:focus {
      border-color: var(--primary-500, #3f51b5);
    }
  `]
})
export class ChatComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input() thesisId!: string;
  @Input() currentUser!: string;

  messages: ChatMessage[] = [];
  newMessage = '';
  collapsed = true;
  isConnected = false;

  private destroy$ = new Subject<void>();
  private currentUserName = '';

  @ViewChild('scrollMe') private scrollContainer!: ElementRef;

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private wsService: WebSocketService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const user = this.authService.user();
    if (user) {
      this.currentUserName = user.name;
    }

    this.wsService.state
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.isConnected = state === 'connected';
        this.cdr.markForCheck();
      });

    if (this.thesisId) {
      this.chatService.joinThesisChat(this.thesisId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: msg => {
            this.messages.push(msg);
            this.cdr.markForCheck();
            this.scrollToBottom();
          },
          error: err => console.error('Chat error:', err)
        });
    }
  }

  ngAfterViewInit() {
    this.scrollToBottom();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private scrollToBottom() {
    setTimeout(() => {
      try {
        const el = this.scrollContainer.nativeElement;
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      } catch {}
    }, 0);
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.isConnected) return;

    const sender = this.currentUserName || this.currentUser;
    this.chatService.sendMessage(this.thesisId, sender, this.newMessage);

    this.newMessage = '';
    this.cdr.markForCheck();
    this.scrollToBottom();
  }

  isMyMessage(msg: ChatMessage): boolean {
    return [this.currentUserName, this.currentUser]
      .filter(Boolean)
      .includes(msg.sender.trim());
  }

  trackByMessage(index: number, msg: ChatMessage) {
    return this.thesisId || `${msg.sender}-${index}`;
  }

  toggleCollapse() {
    this.collapsed = !this.collapsed;

    if (!this.collapsed) {
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }
}
