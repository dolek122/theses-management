import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule, MatCardHeader, MatCardTitle, MatCardContent } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { ScheduleTasksService } from '../../services/schedule-tasks.service';
import { DocumentsService } from '../../services/documents.service';
import { ConsultationsService } from '../../services/consultations.service';
import { ScheduleTask, ScheduleTaskStatus } from '../../models/schedule';
import { DocumentElement, DocumentStatus } from '../../models/document';
import { ConsultationSlot } from '../../models/consultation';
import { AuthService } from '../../services/auth.service';
import { ThesesService } from '../../services/theses.service';

@Component({
	selector: 'app-student-dashboard',
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
		MatDividerModule
	],
	template: `
		<div class="dashboard-container">
			<div class="dashboard-header">
				<h1>Panel Studenta</h1>
				<p class="subtitle">Zarządzaj swoją pracą dyplomową</p>
			</div>

			<!-- Statystyki -->
			<div class="stats-grid">
				<mat-card class="stat-card stat-card-primary">
					<mat-card-content>
						<div class="stat-content">
							<div class="stat-icon">
								<mat-icon>assignment</mat-icon>
							</div>
							<div class="stat-info">
								<div class="stat-value">{{ totalTasks() }}</div>
								<div class="stat-label">Zadania w harmonogramie</div>
							</div>
						</div>
					</mat-card-content>
				</mat-card>

				<mat-card class="stat-card stat-card-success">
					<mat-card-content>
						<div class="stat-content">
							<div class="stat-icon">
								<mat-icon>check_circle</mat-icon>
							</div>
							<div class="stat-info">
								<div class="stat-value">{{ completedTasks() }}</div>
								<div class="stat-label">Zadania ukończone</div>
							</div>
						</div>
					</mat-card-content>
				</mat-card>

				<mat-card class="stat-card stat-card-info">
					<mat-card-content>
						<div class="stat-content">
							<div class="stat-icon">
								<mat-icon>description</mat-icon>
							</div>
							<div class="stat-info">
								<div class="stat-value">{{ totalDocuments() }}</div>
								<div class="stat-label">Elementy pracy</div>
							</div>
						</div>
					</mat-card-content>
				</mat-card>

				<mat-card class="stat-card stat-card-warning">
					<mat-card-content>
						<div class="stat-content">
							<div class="stat-icon">
								<mat-icon>event</mat-icon>
							</div>
							<div class="stat-info">
								<div class="stat-value">{{ upcomingConsultations() }}</div>
								<div class="stat-label">Nadchodzące konsultacje</div>
							</div>
						</div>
					</mat-card-content>
				</mat-card>
			</div>

			<!-- Postęp i szybkie akcje -->
			<div class="content-grid">
				<!-- Postęp pracy -->
				<mat-card class="progress-card">
					<mat-card-header>
						<mat-card-title>
							<mat-icon>trending_up</mat-icon>
							Postęp pracy
						</mat-card-title>
					</mat-card-header>
					<mat-card-content>
						<div class="progress-section">
							<div class="progress-info">
								<span>Postęp ogólny</span>
								<span class="progress-percent">{{ overallProgress() }}%</span>
							</div>
							<mat-progress-bar mode="determinate" [value]="overallProgress()" class="progress-bar"></mat-progress-bar>
						</div>
						<mat-divider style="margin: 16px 0;"></mat-divider>
						<div class="progress-section">
							<div class="progress-info">
								<span>Zadania</span>
								<span class="progress-percent">{{ tasksProgress() }}%</span>
							</div>
							<mat-progress-bar mode="determinate" [value]="tasksProgress()" class="progress-bar"></mat-progress-bar>
						</div>
						<mat-divider style="margin: 16px 0;"></mat-divider>
						<div class="progress-section">
							<div class="progress-info">
								<span>Dokumenty</span>
								<span class="progress-percent">{{ documentsProgress() }}%</span>
							</div>
							<mat-progress-bar mode="determinate" [value]="documentsProgress()" class="progress-bar"></mat-progress-bar>
						</div>
					</mat-card-content>
				</mat-card>

				<!-- Szybkie akcje -->
				<mat-card class="actions-card">
					<mat-card-header>
						<mat-card-title>
							<mat-icon>flash_on</mat-icon>
							Szybkie akcje
						</mat-card-title>
					</mat-card-header>
					<mat-card-content>
						<div class="actions-grid">
							<button mat-raised-button color="primary" routerLink="/student/schedule" class="action-button">
								<mat-icon>add_task</mat-icon>
								Nowe zadanie
							</button>
							<button mat-raised-button color="accent" routerLink="/student/documents" class="action-button">
								<mat-icon>note_add</mat-icon>
								Nowy element
							</button>
							<button mat-raised-button routerLink="/student/consultations" class="action-button">
								<mat-icon>event_available</mat-icon>
								Umów konsultację
							</button>
						</div>
					</mat-card-content>
				</mat-card>
			</div>

			<!-- Ostatnie zadania i dokumenty -->
			<div class="content-grid">
				<!-- Ostatnie zadania -->
				<mat-card class="recent-card">
					<mat-card-header>
						<mat-card-title>
							<mat-icon>schedule</mat-icon>
							Ostatnie zadania
						</mat-card-title>
					</mat-card-header>
					<mat-card-content>
						@if (loading()) {
							<div class="loading">Ładowanie...</div>
						} @else if (recentTasks().length === 0) {
							<div class="empty-state">Brak zadań</div>
						} @else {
							<div class="task-list">
								@for (task of recentTasks(); track task.id) {
									<div class="task-item">
										<div class="task-info">
											<div class="task-name">{{ task.name }}</div>
											<div class="task-meta">
												<span>Termin: {{ task.dueDate || 'Brak' }}</span>
											</div>
										</div>
										<mat-chip [class]="'status-' + task.status">
											{{ getStatusLabel(task.status) }}
										</mat-chip>
									</div>
								}
							</div>
							<div style="margin-top: 16px;">
								<button mat-button routerLink="/student/schedule">Zobacz wszystkie</button>
							</div>
						}
					</mat-card-content>
				</mat-card>

				<!-- Ostatnie dokumenty -->
				<mat-card class="recent-card">
					<mat-card-header>
						<mat-card-title>
							<mat-icon>folder</mat-icon>
							Ostatnie dokumenty
						</mat-card-title>
					</mat-card-header>
					<mat-card-content>
						@if (loading()) {
							<div class="loading">Ładowanie...</div>
						} @else if (recentDocuments().length === 0) {
							<div class="empty-state">Brak dokumentów</div>
						} @else {
							<div class="document-list">
								@for (doc of recentDocuments(); track doc.id) {
									<div class="document-item">
										<div class="document-info">
											<div class="document-name">{{ doc.title }}</div>
											<div class="document-meta">
												<span>{{ getTypeLabel(doc.type) }}</span>
											</div>
										</div>
										<mat-chip [class]="'status-' + doc.status">
											{{ getDocumentStatusLabel(doc.status) }}
										</mat-chip>
									</div>
								}
							</div>
							<div style="margin-top: 16px;">
								<button mat-button routerLink="/student/documents">Zobacz wszystkie</button>
							</div>
						}
					</mat-card-content>
				</mat-card>
			</div>
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

		.progress-card, .actions-card, .recent-card {
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

		.progress-section {
			margin-bottom: 8px;
		}

		.progress-info {
			display: flex;
			justify-content: space-between;
			margin-bottom: 8px;
			font-size: 14px;
		}

		.progress-percent {
			font-weight: 600;
			color: var(--primary-700);
		}

		.progress-bar {
			height: 8px;
			border-radius: 4px;
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

		.task-list, .document-list {
			display: flex;
			flex-direction: column;
			gap: 12px;
		}

		.task-item, .document-item {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 12px;
			background: var(--bg-secondary);
			border-radius: var(--radius-md);
		}

		.task-info, .document-info {
			flex: 1;
		}

		.task-name, .document-name {
			font-weight: 500;
			margin-bottom: 4px;
		}

		.task-meta, .document-meta {
			font-size: 12px;
			color: var(--text-secondary);
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
export class StudentDashboardComponent implements OnInit {
	loading = signal(false);
	tasks = signal<ScheduleTask[]>([]);
	documents = signal<DocumentElement[]>([]);
	totalTasks = signal(0);
	completedTasks = signal(0);
	totalDocuments = signal(0);
	upcomingConsultations = signal(0);
	thesisId = signal<string | null>(null);

	constructor(
		private readonly tasksService: ScheduleTasksService,
		private readonly docsService: DocumentsService,
		private readonly auth: AuthService,
		private readonly thesesService: ThesesService
	) {}

	ngOnInit(): void {
		this.loadThesis();
	}

	loadThesis(): void {
		const user = this.auth.user();
		if (!user) return;

		this.loading.set(true);
		this.thesesService.getByStudentId(user.id).subscribe({
			next: (thesis) => {
				this.thesisId.set(thesis.id);
				this.loadData();
			},
			error: () => this.loading.set(false)
		});
	}

	loadData(): void {
		const id = this.thesisId();
		if (!id) return;

		this.tasksService.list(id).subscribe({
			next: (tasks) => {
				this.tasks.set(tasks);
				this.totalTasks.set(tasks.length);
				this.completedTasks.set(tasks.filter(t => t.status === 'completed').length);
				this.loading.set(false);
			},
			error: () => this.loading.set(false)
		});

		this.docsService.list(id).subscribe({
			next: (docs) => {
				this.documents.set(docs);
				this.totalDocuments.set(docs.length);
			}
		});
	}

	recentTasks() {
		return this.tasks().slice(0, 5);
	}

	recentDocuments() {
		return this.documents().slice(0, 5);
	}

	overallProgress(): number {
		const tasks = this.tasks();
		const docs = this.documents();
		if (tasks.length === 0 && docs.length === 0) return 0;
		
		const tasksProgress = this.tasksProgress();
		const docsProgress = this.documentsProgress();
		return Math.round((tasksProgress + docsProgress) / 2);
	}

	tasksProgress(): number {
		const tasks = this.tasks();
		if (tasks.length === 0) return 0;
		const completed = tasks.filter(t => t.status === 'completed').length;
		return Math.round((completed / tasks.length) * 100);
	}

	documentsProgress(): number {
		const docs = this.documents();
		if (docs.length === 0) return 0;
		const reviewed = docs.filter(d => d.status === 'reviewed').length;
		return Math.round((reviewed / docs.length) * 100);
	}

	getStatusLabel(status: ScheduleTaskStatus): string {
		const labels: Record<ScheduleTaskStatus, string> = {
			pending: 'Oczekujące',
			in_review: 'W trakcie',
			completed: 'Ukończone'
		};
		return labels[status] || status;
	}

	getTypeLabel(type: string): string {
		const labels: Record<string, string> = {
			table_of_contents: 'Spis treści',
			chapter: 'Rozdział',
			bibliography: 'Bibliografia'
		};
		return labels[type] || type;
	}

	getDocumentStatusLabel(status: DocumentStatus): string {
		const labels: Record<DocumentStatus, string> = {
			draft: 'Szkic',
			submitted: 'Wysłane',
			reviewed: 'Zatwierdzone'
		};
		return labels[status] || status;
	}
}
