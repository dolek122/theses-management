import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule, MatCardHeader, MatCardTitle, MatCardContent } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { ThesesService } from '../../services/theses.service';
import { ScheduleTasksService } from '../../services/schedule-tasks.service';
import { DocumentsService } from '../../services/documents.service';
import { ConsultationsService } from '../../services/consultations.service';
import { Thesis } from '../../models/thesis';
import { ScheduleTask } from '../../models/schedule';
import { DocumentElement } from '../../models/document';
import { ConsultationSlot } from '../../models/consultation';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';

@Component({
	selector: 'app-promoter-dashboard',
	standalone: true,
	imports: [
		CommonModule,
		RouterLink,
		MatCardModule,
		MatCardHeader,
		MatCardTitle,
		MatCardContent,
		MatButtonModule,
		MatIconModule,
		MatProgressBarModule,
		MatChipsModule,
		MatDividerModule,
		MatTableModule
	],
	template: `
		<div class="dashboard-container">
			<div class="dashboard-header">
				<h1>Panel {{ isReviewer() ? 'Recenzenta' : 'Promotora' }}</h1>
				<p class="subtitle">Zarządzaj pracami dyplomowymi i ocenami</p>
			</div>

			<!-- Statystyki -->
			<div class="stats-grid">
				<mat-card class="stat-card stat-card-primary">
					<mat-card-content>
						<div class="stat-content">
							<div class="stat-icon">
								<mat-icon>book</mat-icon>
							</div>
							<div class="stat-info">
								<div class="stat-value">{{ totalTheses() }}</div>
								<div class="stat-label">Przypisane prace</div>
							</div>
						</div>
					</mat-card-content>
				</mat-card>

				<mat-card class="stat-card stat-card-success">
					<mat-card-content>
						<div class="stat-content">
							<div class="stat-icon">
								<mat-icon>people</mat-icon>
							</div>
							<div class="stat-info">
								<div class="stat-value">{{ activeStudents() }}</div>
								<div class="stat-label">Aktywni studenci</div>
							</div>
						</div>
					</mat-card-content>
				</mat-card>

				<mat-card class="stat-card stat-card-info">
					<mat-card-content>
						<div class="stat-content">
							<div class="stat-icon">
								<mat-icon>assignment_turned_in</mat-icon>
							</div>
							<div class="stat-info">
								<div class="stat-value">{{ pendingEvaluations() }}</div>
								<div class="stat-label">Oceny do sprawdzenia</div>
							</div>
						</div>
					</mat-card-content>
				</mat-card>

				<mat-card class="stat-card stat-card-warning" *ngIf="!isReviewer()">
					<mat-card-content>
						<div class="stat-content">
							<div class="stat-icon">
								<mat-icon>event</mat-icon>
							</div>
							<div class="stat-info">
								<div class="stat-value">{{ upcomingSlots() }}</div>
								<div class="stat-label">Nadchodzące konsultacje</div>
							</div>
						</div>
					</mat-card-content>
				</mat-card>
			</div>

			<!-- Szybkie akcje i statystyki -->
			<div class="content-grid">
				<!-- Szybkie akcje -->
				<mat-card class="actions-card" *ngIf="!isReviewer()">
					<mat-card-header>
						<mat-card-title>
							<mat-icon>flash_on</mat-icon>
							Szybkie akcje
						</mat-card-title>
					</mat-card-header>
					<mat-card-content>
						<div class="actions-grid">
							<button mat-raised-button color="primary" routerLink="/promoter/thesis-registration" class="action-button">
								<mat-icon>add_circle</mat-icon>
								Nowa praca
							</button>
							<button mat-raised-button color="accent" routerLink="/promoter/student-link" class="action-button">
								<mat-icon>link</mat-icon>
								Powiąż studenta
							</button>
							<button mat-raised-button routerLink="/promoter/evaluations" class="action-button">
								<mat-icon>rate_review</mat-icon>
								Sprawdź oceny
							</button>
							<button mat-raised-button routerLink="/promoter/consultations" class="action-button">
								<mat-icon>event_available</mat-icon>
								Zarządzaj konsultacjami
							</button>
							<button mat-raised-button routerLink="/promoter/users" class="action-button">
								<mat-icon>people</mat-icon>
								Zarządzaj użytkownikami
							</button>
						</div>
					</mat-card-content>
				</mat-card>

				<!-- Statystyki ocen -->
				<mat-card class="stats-card">
					<mat-card-header>
						<mat-card-title>
							<mat-icon>bar_chart</mat-icon>
							Statystyki ocen
						</mat-card-title>
					</mat-card-header>
					<mat-card-content>
						<div class="stat-item">
							<div class="stat-label-small">Średnia ocena zadań</div>
							<div class="stat-value-small">{{ averageTaskGrade() || 'Brak' }}</div>
						</div>
						<mat-divider style="margin: 12px 0;"></mat-divider>
						<div class="stat-item">
							<div class="stat-label-small">Średnia ocena dokumentów</div>
							<div class="stat-value-small">{{ averageDocGrade() || 'Brak' }}</div>
						</div>
						<mat-divider style="margin: 12px 0;"></mat-divider>
						<div class="stat-item">
							<div class="stat-label-small">Zadania oczekujące</div>
							<div class="stat-value-small">{{ pendingTasksCount() }}</div>
						</div>
					</mat-card-content>
				</mat-card>
			</div>

			<!-- Ostatnie prace -->
			<mat-card class="recent-card">
				<mat-card-header>
					<mat-card-title>
						<mat-icon>folder</mat-icon>
						Ostatnie prace dyplomowe
					</mat-card-title>
				</mat-card-header>
				<mat-card-content>
					@if (loading()) {
						<div class="loading">Ładowanie...</div>
					} @else if (recentTheses().length === 0) {
						<div class="empty-state">Brak prac</div>
					} @else {
						<div class="thesis-list">
							@for (thesis of recentTheses(); track thesis.id) {
								<div class="thesis-item">
									<div class="thesis-info">
										<div class="thesis-title">{{ thesis.title }}</div>
										<div class="thesis-meta">
											<span>Opis: {{ thesis.description || 'Brak opisu' }}</span>
											@if (thesis.studentId) {
												<span class="student-badge">Przypisany student</span>
											} @else {
												<span class="no-student-badge">Brak studenta</span>
											}
										</div>
									</div>
									<div class="thesis-actions">
										<button mat-icon-button (click)="openChat(thesis.id)" title="Otwórz czat">
											<mat-icon>chat</mat-icon>
										</button>
										<button *ngIf="!isReviewer()" mat-icon-button routerLink="/promoter/student-link" [queryParams]="{thesisId: thesis.id}">
											<mat-icon>edit</mat-icon>
										</button>
									</div>
								</div>
							}
						</div>
						<div style="margin-top: 16px;" *ngIf="!isReviewer()">
							<button mat-button routerLink="/promoter/thesis-registration">Zobacz wszystkie</button>
						</div>
					}
				</mat-card-content>
			</mat-card>

			<!-- Ostatnie konsultacje -->
			<mat-card class="recent-card" *ngIf="!isReviewer()">
				<mat-card-header>
					<mat-card-title>
						<mat-icon>event</mat-icon>
						Nadchodzące konsultacje
					</mat-card-title>
				</mat-card-header>
				<mat-card-content>
					@if (loading()) {
						<div class="loading">Ładowanie...</div>
					} @else if (upcomingConsultationsList().length === 0) {
						<div class="empty-state">Brak nadchodzących konsultacji</div>
					} @else {
						<div class="consultation-list">
							@for (slot of upcomingConsultationsList(); track slot.id) {
								<div class="consultation-item">
									<div class="consultation-info">
								<div class="consultation-time">
									<mat-icon>schedule</mat-icon>
									{{ slot.startTime }} - {{ slot.endTime }}
								</div>
										<div class="consultation-meta">
											<span>Zapisanych: {{ slot.registeredStudentIds.length || 0 }} / {{ slot.capacity }}</span>
											@if (slot.notes) {
												<span class="notes">{{ slot.notes }}</span>
											}
										</div>
									</div>
									<mat-chip [class]="slot.registeredStudentIds.length === slot.capacity ? 'full' : 'available'">
										{{ slot.registeredStudentIds.length === slot.capacity ? 'Pełne' : 'Dostępne' }}
									</mat-chip>
								</div>
							}
						</div>
						<div style="margin-top: 16px;">
							<button mat-button routerLink="/promoter/consultations">Zarządzaj konsultacjami</button>
						</div>
					}
				</mat-card-content>
			</mat-card>
		</div>
	`,
	styles: [`
		.dashboard-container {
			max-width: 1400px;
			margin: 0 auto;
			padding: 24px;
		}

		.dashboard-header {
			margin-bottom: 32px;
		}

		.dashboard-header h1 {
			margin: 0 0 8px 0;
			font-size: 32px;
			font-weight: 500;
			color: var(--primary-700);
		}

		.subtitle {
			margin: 0;
			color: var(--text-secondary);
			font-size: 16px;
		}

		.stats-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
			gap: 24px;
			margin-bottom: 32px;
		}

		.stat-card {
			border-radius: var(--radius-lg);
			box-shadow: var(--shadow-sm);
			transition: transform 0.2s, box-shadow 0.2s;
		}

		.stat-card:hover {
			transform: translateY(-4px);
			box-shadow: var(--shadow-lg);
		}

		.stat-card-primary {
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			color: white;
		}

		.stat-card-success {
			background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
			color: white;
		}

		.stat-card-info {
			background: linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%);
			color: white;
		}

		.stat-card-warning {
			background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
			color: white;
		}

		.stat-content {
			display: flex;
			align-items: center;
			gap: 16px;
		}

		.stat-icon {
			font-size: 48px;
			width: 48px;
			height: 48px;
			display: flex;
			align-items: center;
			justify-content: center;
		}

		.stat-info {
			flex: 1;
		}

		.stat-value {
			font-size: 36px;
			font-weight: 600;
			line-height: 1;
			margin-bottom: 4px;
		}

		.stat-label {
			font-size: 14px;
			opacity: 0.9;
		}

		.content-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
			gap: 24px;
			margin-bottom: 24px;
		}

		.actions-card, .stats-card, .recent-card {
			border-radius: 12px;
		}

		mat-card-header {
			margin-bottom: 16px;
		}

		mat-card-title {
			display: flex;
			align-items: center;
			gap: 8px;
			font-size: 20px;
			font-weight: 500;
		}

		.actions-grid {
			display: flex;
			flex-direction: column;
			gap: 12px;
		}

		.action-button {
			width: 100%;
			height: 48px;
			display: flex;
			align-items: center;
			justify-content: flex-start;
			gap: 12px;
		}

		.stat-item {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 16px;
		}

		.stat-label-small {
			font-size: 14px;
			color: var(--text-secondary);
		}

		.stat-value-small {
			font-size: 18px;
			font-weight: 600;
			color: var(--primary-700);
		}

		.thesis-list, .consultation-list {
			display: flex;
			flex-direction: column;
			gap: 12px;
		}

		.thesis-item, .consultation-item {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 16px;
			background: var(--bg-secondary);
			border-radius: var(--radius-md);
		}

		.thesis-info, .consultation-info {
			flex: 1;
		}

		.thesis-title {
			font-weight: 500;
			font-size: 16px;
			margin-bottom: 8px;
			color: var(--primary-700);
		}

		.thesis-meta {
			display: flex;
			gap: 16px;
			font-size: 12px;
			color: var(--text-secondary);
			flex-wrap: wrap;
		}

		.student-badge {
			background: var(--status-success);
			color: white;
			padding: 2px 8px;
			border-radius: 12px;
			font-size: 11px;
		}

		.no-student-badge {
			background: var(--status-warning);
			color: white;
			padding: 2px 8px;
			border-radius: 12px;
			font-size: 11px;
		}

		.consultation-time {
			display: flex;
			align-items: center;
			gap: 8px;
			font-weight: 500;
			margin-bottom: 8px;
		}

		.consultation-meta {
			display: flex;
			gap: 16px;
			font-size: 12px;
			color: var(--text-secondary);
			flex-wrap: wrap;
		}

		.notes {
			font-style: italic;
		}

		@media (max-width: 768px) {
			.dashboard-container {
				padding: 16px;
			}

			.stats-grid {
				grid-template-columns: 1fr;
			}

			.content-grid {
				grid-template-columns: 1fr;
			}
		}
	`]
})
export class PromoterDashboardComponent implements OnInit {
	loading = signal(false);
	theses = signal<Thesis[]>([]);
	allTasks = signal<ScheduleTask[]>([]);
	allDocuments = signal<DocumentElement[]>([]);
	consultations = signal<ConsultationSlot[]>([]);

	totalTheses = signal(0);
	activeStudents = signal(0);
	pendingEvaluations = signal(0);
	upcomingSlots = signal(0);
	selectedThesisId = signal('');
	isReviewer = signal(false);

	constructor(
		private readonly thesesService: ThesesService,
		private readonly tasksService: ScheduleTasksService,
		private readonly docsService: DocumentsService,
		private readonly consultationsService: ConsultationsService,
		private readonly authService: AuthService,
		private readonly chatService: ChatService
	) {}

	ngOnInit(): void {
		this.isReviewer.set(this.authService.role() === 'reviewer');
		this.loadData();
	}

	loadData(): void {
		const user = this.authService.user();
		if (!user) return;
		const userId = user.id;
		this.loading.set(true);

		// Load theses
		this.thesesService.list().subscribe({
			next: (theses) => {
				const myTheses = theses.filter(t => t.promoterId === userId || t.reviewerId === userId);
				this.theses.set(myTheses);
				if (myTheses.length > 0) {
					this.selectedThesisId.set(myTheses[0].id);
				}
				this.totalTheses.set(myTheses.length);
				this.activeStudents.set(myTheses.filter(t => t.studentId).length);
				this.loading.set(false);

				// Load tasks and documents for these theses
				let allTasks: ScheduleTask[] = [];
				let allDocs: DocumentElement[] = [];

				myTheses.forEach(thesis => {
					this.tasksService.list(thesis.id).subscribe({
						next: (tasks) => {
							allTasks = [...allTasks, ...tasks];
							this.allTasks.set(allTasks);
							this.updatePendingEvaluations(allTasks, allDocs);
						}
					});

					this.docsService.list(thesis.id).subscribe({
						next: (docs) => {
							allDocs = [...allDocs, ...docs];
							this.allDocuments.set(allDocs);
							this.updatePendingEvaluations(allTasks, allDocs);
						}
					});
				});
			},
			error: () => this.loading.set(false)
		});

		// Load consultations only for promoter
		if (!this.isReviewer()) {
			this.consultationsService.listForPromoter(userId).subscribe({
				next: (slots) => {
					this.consultations.set(slots);
					const upcoming = slots.filter(s => {
						if (!s.startTime) return false;
						const slotDate = new Date(s.startTime);
						return slotDate >= new Date();
					});
					this.upcomingSlots.set(upcoming.length);
				}
			});
		}
	}

	updatePendingEvaluations(tasks: ScheduleTask[], docs: DocumentElement[]) {
		this.pendingEvaluations.set(
			tasks.filter(t => t.status === 'in_review' || t.status === 'pending').length +
			docs.filter(d => d.status === 'submitted').length
		);
	}

	recentTheses() {
		return this.theses().slice(0, 5);
	}

	upcomingConsultationsList() {
		return this.consultations()
			.filter(s => {
				if (!s.startTime) return false;
				const slotDate = new Date(s.startTime);
				return slotDate >= new Date();
			})
			.slice(0, 5)
			.sort((a, b) => {
				if (!a.startTime || !b.startTime) return 0;
				return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
			});
	}

	averageTaskGrade(): number | null {
		const tasks = this.allTasks().filter(t => t.grade != null);
		if (tasks.length === 0) return null;
		const sum = tasks.reduce((acc, t) => acc + (t.grade || 0), 0);
		return Math.round((sum / tasks.length) * 10) / 10;
	}

	averageDocGrade(): number | null {
		const docs = this.allDocuments().filter(d => d.grade != null);
		if (docs.length === 0) return null;
		const sum = docs.reduce((acc, d) => acc + (d.grade || 0), 0);
		return Math.round((sum / docs.length) * 10) / 10;
	}

	pendingTasksCount(): number {
		return this.allTasks().filter(t => t.status === 'pending' || t.status === 'in_review').length;
	}

	openChat(thesisId: string): void {
		this.chatService.openChat(thesisId);
	}
}
