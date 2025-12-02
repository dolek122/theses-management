import { Component, computed, effect, signal, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { BreakpointObserver, Breakpoints, LayoutModule } from '@angular/cdk/layout';
import { AuthService } from './services/auth.service';
import { WebSocketService } from './services/websocket.service';
import { NotificationService } from './services/notification.service';
import { ThesesService } from './services/theses.service';
import { ChatService } from './services/chat.service';
import { ChatComponent } from './features/chat/chat.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterOutlet, 
    RouterLink, 
    RouterLinkActive, 
    LayoutModule, 
    MatToolbarModule, 
    MatSidenavModule, 
    MatListModule, 
    MatButtonModule, 
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    ChatComponent
  ],
  template: `
    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav #sidenav [mode]="sidenavMode()" [opened]="sidenavOpened()" class="sidenav">
        <div class="sidenav-header">
          <mat-icon>school</mat-icon>
          <span>System Pracy</span>
        </div>
        <mat-nav-list class="nav-list">
          @if (!role()) {
            <a mat-list-item routerLink="/login" routerLinkActive="active">
              <mat-icon>login</mat-icon>
              <span>Logowanie</span>
            </a>
          }
          @if (role() === 'student') {
            <div class="nav-section">Student</div>
            <a mat-list-item routerLink="/student/dashboard" routerLinkActive="active">
              <mat-icon>dashboard</mat-icon>
              <span>Panel</span>
            </a>
            <a mat-list-item routerLink="/student/schedule" routerLinkActive="active">
              <mat-icon>schedule</mat-icon>
              <span>Harmonogram</span>
            </a>
            <a mat-list-item routerLink="/student/documents" routerLinkActive="active">
              <mat-icon>description</mat-icon>
              <span>Elementy pracy</span>
            </a>
            <a mat-list-item routerLink="/student/consultations" routerLinkActive="active">
              <mat-icon>event</mat-icon>
              <span>Konsultacje</span>
            </a>
          }
          @if (role() === 'promoter' || role() === 'reviewer') {
            <div class="nav-section">{{ role() === 'reviewer' ? 'Recenzent' : 'Promotor' }}</div>
            <a mat-list-item routerLink="/promoter/dashboard" routerLinkActive="active">
              <mat-icon>dashboard</mat-icon>
              <span>Panel</span>
            </a>
            @if (role() === 'promoter') {
              <a mat-list-item routerLink="/promoter/thesis-registration" routerLinkActive="active">
                <mat-icon>add_circle</mat-icon>
                <span>Rejestracja pracy</span>
              </a>
              <a mat-list-item routerLink="/promoter/student-link" routerLinkActive="active">
                <mat-icon>link</mat-icon>
                <span>Powiązanie dyplomanta</span>
              </a>
            }
            <a mat-list-item routerLink="/promoter/evaluations" routerLinkActive="active">
              <mat-icon>rate_review</mat-icon>
              <span>Oceny</span>
            </a>
            @if (role() === 'promoter') {
              <a mat-list-item routerLink="/promoter/remarks" routerLinkActive="active">
                <mat-icon>comment</mat-icon>
                <span>Uwagi</span>
              </a>
              <a mat-list-item routerLink="/promoter/consultations" routerLinkActive="active">
                <mat-icon>event_available</mat-icon>
                <span>Terminy konsultacji</span>
              </a>
            }
          }
          @if (role() === 'admin') {
             <div class="nav-section">Administrator</div>
             <a mat-list-item routerLink="/admin/users" routerLinkActive="active">
                <mat-icon>people</mat-icon>
                <span>Użytkownicy</span>
              </a>
          }
        </mat-nav-list>
        @if (role()) {
          <div class="sidenav-footer">
            <button mat-button (click)="logout()" class="logout-button">
              <mat-icon>logout</mat-icon>
              <span>Wyloguj</span>
            </button>
          </div>
        }
      </mat-sidenav>
      <mat-sidenav-content>
        <mat-toolbar color="primary" class="toolbar">
          <button mat-icon-button (click)="toggleSidenav(sidenav)" class="menu-button">
            <mat-icon>menu</mat-icon>
          </button>
          <div class="toolbar-title">
            <mat-icon>school</mat-icon>
            <span>System Zarządzania Pracami Dyplomowymi</span>
          </div>
          <span class="spacer"></span>
          
          <!-- Notifications -->
          @if (role()) {
            <button mat-icon-button [matMenuTriggerFor]="notificationMenu">
                <mat-icon [matBadge]="unreadCount()" matBadgeColor="warn" [matBadgeHidden]="unreadCount() === 0">notifications</mat-icon>
            </button>
            <mat-menu #notificationMenu="matMenu">
                <div class="notification-container" (click)="$event.stopPropagation()">
                    <div class="notification-header">
                        <span>Powiadomienia</span>
                        <button mat-button color="primary" (click)="markAllRead()">Oznacz wszystkie</button>
                    </div>
                    <div class="notification-list">
                        @for (n of notifications(); track n.id) {
                            <div class="notification-item" [class.unread]="!n.read" (click)="markRead(n.id)">
                                <div class="notification-message">{{ n.message }}</div>
                                <div class="notification-date">{{ n.date | date:'short' }}</div>
                            </div>
                        }
                        @if (notifications().length === 0) {
                            <div class="empty-notifications">Brak powiadomień</div>
                        }
                    </div>
                </div>
            </mat-menu>

            <div class="user-info">
              <mat-icon>account_circle</mat-icon>
              <span>
                {{ role() === 'student' ? 'Student' : role() === 'promoter' ? 'Promotor' : role() === 'admin' ? 'Administrator' : 'Recenzent' }}
              </span>
            </div>
          }
        </mat-toolbar>
        <div class="content-wrapper">
          <router-outlet />
        </div>
        
        <!-- Chat Component Floating -->
        @if (chatThesisId() && role() !== 'admin') {
            <app-chat [thesisId]="chatThesisId()!" [currentUser]="currentUserName"></app-chat>
        }
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styleUrl: './app.scss',
  styles: [`
    .notification-container {
        width: 320px;
        max-height: 400px;
        display: flex;
        flex-direction: column;
    }
    .notification-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 16px;
        border-bottom: 1px solid #e0e0e0;
        font-weight: 500;
    }
    .notification-list {
        overflow-y: auto;
        max-height: 350px;
    }
    .notification-item {
        padding: 12px 16px;
        border-bottom: 1px solid #f0f0f0;
        cursor: pointer;
        transition: background-color 0.2s;
    }
    .notification-item:hover {
        background-color: #f5f5f5;
    }
    .notification-item.unread {
        background-color: #e3f2fd;
    }
    .notification-message {
        font-size: 14px;
        margin-bottom: 4px;
    }
    .notification-date {
        font-size: 11px;
        color: #757575;
    }
    .empty-notifications {
        padding: 20px;
        text-align: center;
        color: #757575;
    }
  `]
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('theses-management');
  private subscriptions: Subscription[] = [];
  
  chatThesisId = computed(() => this.chatService.activeThesisId());
  currentUserName = '';

  notifications = computed(() => this.notificationService.notifications());
  unreadCount = computed(() => this.notifications().filter(n => !n.read).length);

  toggleSidenav(sidenav: { toggle: () => void }): void {
    sidenav.toggle();
  }

  private isHandset = signal(false);

  constructor(
    private readonly breakpoints: BreakpointObserver,
    private readonly auth: AuthService,
    private readonly webSocketService: WebSocketService,
    private readonly notificationService: NotificationService,
    private readonly thesesService: ThesesService,
    private readonly chatService: ChatService
  ) {
    this.breakpoints.observe([Breakpoints.Handset]).subscribe(result => {
      this.isHandset.set(result.matches);
    });

    effect(() => {
      const role = this.auth.role();
      const user = this.auth.user();
      if (role && user) {
        this.currentUserName = user.name;
        this.webSocketService.connect();
        this.setupNotificationsAndChat(role);
      } else {
        this.webSocketService.disconnect();
        this.unsubscribeAll();
        this.chatService.closeChat();
        this.notificationService.clear();
      }
    });
  }

  ngOnInit() {}

  ngOnDestroy() {
    this.unsubscribeAll();
  }

  markRead(id: string) {
      this.notificationService.markAsRead(id);
  }
  
  markAllRead() {
      this.notificationService.markAllAsRead();
  }

  private unsubscribeAll() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  private setupNotificationsAndChat(role: string) {
    this.unsubscribeAll();
    const user = this.auth.user();
    if (!user) return;

    if (role === 'student') {
      this.thesesService.getByStudentId(user.id).subscribe({
        next: (thesis) => {
          // Setup Chat
          this.chatService.openChat(thesis.id); // Student always sees their chat

          // Setup Notifications
          const sub = this.webSocketService.subscribe<any>(`/topic/thesis/${thesis.id}/events`).subscribe(event => {
            this.notificationService.handleEvent(event);
          });
          this.subscriptions.push(sub);
        },
        error: () => {
          // User has no thesis yet, do nothing
        }
      });
    } else if (role === 'promoter' || role === 'reviewer') { // Updated to include reviewer
      this.thesesService.list().subscribe({
        next: (theses) => {
          const myTheses = theses.filter(t => t.promoterId === user.id || t.reviewerId === user.id);
          
          myTheses.forEach(thesis => {
            const sub = this.webSocketService.subscribe<any>(`/topic/thesis/${thesis.id}/events`).subscribe(event => {
              this.notificationService.handleEvent(event);
            });
            this.subscriptions.push(sub);
          });
        }
      });
    }
  }

  sidenavMode(): 'over' | 'side' {
    return this.isHandset() ? 'over' : 'side';
    }
  sidenavOpened(): boolean {
    return !this.isHandset();
  }

  role = computed(() => this.auth.role());
  logout(): void {
    this.auth.clear();
  }
}
