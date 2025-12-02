import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { ScheduleTasksService } from '../../services/schedule-tasks.service';
import { DocumentsService } from '../../services/documents.service';
import { ThesesService } from '../../services/theses.service';
import { AuthService } from '../../services/auth.service';
import { ThesisEventsService } from '../../services/thesis-events.service';
import { ChatService } from '../../services/chat.service';
import { Subscription } from 'rxjs';

interface EvalRow {
	id: string;
	type: 'task' | 'document';
	thesisId: string;
	title: string;
	status: string;
	grade?: number;
	comment?: string;
	fileName?: string;
}

@Component({
	selector: 'app-promoter-evaluations',
	standalone: true,
	imports: [CommonModule, FormsModule, MatTableModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatProgressSpinnerModule, MatIconModule],
	template: `
		<h3>Ocena harmonogramu i elementów pracy</h3>
		@if (loading) {
			<mat-spinner style="margin: 20px auto;"></mat-spinner>
		} @else {
			<table mat-table [dataSource]="items" class="mat-elevation-z1" style="width:100%;">
				<ng-container matColumnDef="type">
					<th mat-header-cell *matHeaderCellDef>Typ</th>
					<td mat-cell *matCellDef="let r">{{ r.type === 'task' ? 'Zadanie' : 'Dokument' }}</td>
				</ng-container>
				<ng-container matColumnDef="title">
					<th mat-header-cell *matHeaderCellDef>Tytuł</th>
					<td mat-cell *matCellDef="let r">
						{{ r.title }}
						<small *ngIf="r.fileName" style="display:block; color:gray;">{{ r.fileName }}</small>
					</td>
				</ng-container>
				<ng-container matColumnDef="status">
					<th mat-header-cell *matHeaderCellDef>Status</th>
					<td mat-cell *matCellDef="let r">{{ r.status }}</td>
				</ng-container>
				<ng-container matColumnDef="grade">
					<th mat-header-cell *matHeaderCellDef>Ocena</th>
					<td mat-cell *matCellDef="let r">
						<mat-form-field appearance="outline" style="width:100px; margin-bottom: -1.25em">
							<mat-label>0-5</mat-label>
							<input matInput type="number" min="0" max="5" step="0.5" [(ngModel)]="r.grade" name="grade-{{r.id}}" />
						</mat-form-field>
					</td>
				</ng-container>
				<ng-container matColumnDef="comment">
					<th mat-header-cell *matHeaderCellDef>Komentarz</th>
					<td mat-cell *matCellDef="let r">
						<mat-form-field appearance="outline" style="width:100%; margin-bottom: -1.25em">
							<mat-label>Uwagi</mat-label>
							<input matInput [(ngModel)]="r.comment" name="comment-{{r.id}}" />
						</mat-form-field>
					</td>
				</ng-container>
				<ng-container matColumnDef="actions">
					<th mat-header-cell *matHeaderCellDef>Akcje</th>
					<td mat-cell *matCellDef="let r">
						<button mat-icon-button (click)="download(r)" *ngIf="r.fileName" title="Pobierz">
							<mat-icon>download</mat-icon>
						</button>
						<button mat-icon-button (click)="openChat(r.thesisId)" title="Otwórz czat" color="accent">
							<mat-icon>chat</mat-icon>
						</button>
						<button mat-icon-button color="primary" (click)="save(r)" [disabled]="saving" title="Zapisz">
							<mat-icon>save</mat-icon>
						</button>
					</td>
				</ng-container>

				<tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
				<tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
			</table>
		}
	`
})
export class PromoterEvaluationsComponent implements OnInit, OnDestroy {
	displayedColumns = ['type', 'title', 'status', 'grade', 'comment', 'actions'];
	items: EvalRow[] = [];
	loading = false;
	saving = false;
	userId = '';
	private subscriptions: Subscription[] = [];
	private thesisIds: string[] = [];

	constructor(
		private readonly thesesService: ThesesService,
		private readonly scheduleService: ScheduleTasksService,
		private readonly documentsService: DocumentsService,
		private readonly eventsService: ThesisEventsService,
		private readonly chatService: ChatService,
		private readonly auth: AuthService
	) {}

	ngOnInit(): void {
		const user = this.auth.user();
		if (user && (user.role === 'promoter' || user.role === 'reviewer')) {
			this.userId = user.id;
			this.loadItems();
		}
	}

	ngOnDestroy(): void {
		this.thesisIds.forEach(thesisId => {
			this.eventsService.unsubscribe(thesisId);
		});
		this.subscriptions.forEach(sub => sub.unsubscribe());
	}

	loadItems(): void {
		this.loading = true;
		this.thesesService.list().subscribe({
			next: (theses) => {
				const myTheses = theses.filter(t => t.promoterId === this.userId || t.reviewerId === this.userId);
				
				// Unsubscribe from old event streams
				this.thesisIds.forEach(thesisId => {
					this.eventsService.unsubscribe(thesisId);
				});
				this.thesisIds = [];

				if (myTheses.length === 0) {
					this.items = [];
					this.loading = false;
					return;
				}

				// Collect all observable requests
				const requests: Promise<EvalRow[]>[] = [];

				myTheses.forEach(thesis => {
					this.thesisIds.push(thesis.id);
					
					// Subscribe to events
					const sub = this.eventsService.subscribe(thesis.id).subscribe({
						next: (event) => {
							if (event.updateType === 'schedule_task' || event.updateType === 'document') {
								this.refreshItems();
							}
						}
					});
					this.subscriptions.push(sub);

					// Fetch tasks
					requests.push(new Promise(resolve => {
						this.scheduleService.list(thesis.id).subscribe({
							next: (tasks) => {
								const rows: EvalRow[] = tasks
									.filter(t => t.status === 'in_review' || t.status === 'completed')
									.map(t => ({
										id: t.id,
										type: 'task',
										thesisId: thesis.id,
										title: t.name,
										status: t.status,
										grade: t.grade,
										comment: t.comments
									}));
								resolve(rows);
							},
							error: () => resolve([])
						});
					}));

					// Fetch documents
					requests.push(new Promise(resolve => {
						this.documentsService.list(thesis.id).subscribe({
							next: (docs) => {
								const rows: EvalRow[] = docs
									.filter(d => d.status === 'submitted' || d.status === 'reviewed')
									.map(d => ({
										id: d.id,
										type: 'document',
										thesisId: thesis.id,
										title: d.title,
										status: d.status,
										grade: d.grade,
										comment: d.comments,
										fileName: d.fileName
									}));
								resolve(rows);
							},
							error: () => resolve([])
						});
					}));
				});

				Promise.all(requests).then(results => {
					this.items = results.flat();
					this.loading = false;
				});
			},
			error: (err) => {
				console.error('Failed to load theses', err);
				this.loading = false;
			}
		});
	}

	refreshItems(): void {
		this.thesesService.list().subscribe({
			next: (theses) => {
				const myTheses = theses.filter(t => t.promoterId === this.userId || t.reviewerId === this.userId);
				if (myTheses.length === 0) {
					this.items = [];
					return;
				}

				const requests: Promise<EvalRow[]>[] = [];
				myTheses.forEach(thesis => {
					requests.push(new Promise(resolve => {
						this.scheduleService.list(thesis.id).subscribe({
							next: (tasks) => {
								const rows: EvalRow[] = tasks
									.filter(t => t.status === 'in_review' || t.status === 'completed')
									.map(t => ({
										id: t.id,
										type: 'task',
										thesisId: thesis.id,
										title: t.name,
										status: t.status,
										grade: t.grade,
										comment: t.comments
									}));
								resolve(rows);
							},
							error: () => resolve([])
						});
					}));

					requests.push(new Promise(resolve => {
						this.documentsService.list(thesis.id).subscribe({
							next: (docs) => {
								const rows: EvalRow[] = docs
									.filter(d => d.status === 'submitted' || d.status === 'reviewed')
									.map(d => ({
										id: d.id,
										type: 'document',
										thesisId: thesis.id,
										title: d.title,
										status: d.status,
										grade: d.grade,
										comment: d.comments,
										fileName: d.fileName
									}));
								resolve(rows);
							},
							error: () => resolve([])
						});
					}));
				});

				Promise.all(requests).then(results => {
					this.items = results.flat();
				});
			}
		});
	}

	save(row: EvalRow): void {
		this.saving = true;
		if (row.type === 'task') {
			this.scheduleService.update(row.thesisId, row.id, {
				grade: row.grade,
				comments: row.comment,
				status: (row.grade ? 'completed' : row.status) as any // Type assertion
			}).subscribe({
				next: () => {
					this.refreshItems();
					this.saving = false;
				},
				error: (err) => {
					console.error('Failed to update task', err);
					this.saving = false;
				}
			});
		} else {
			this.documentsService.update(row.thesisId, row.id, {
				grade: row.grade,
				comments: row.comment,
				status: (row.grade ? 'reviewed' : row.status) as any // Type assertion
			}).subscribe({
				next: () => {
					this.refreshItems();
					this.saving = false;
				},
				error: (err) => {
					console.error('Failed to update document', err);
					this.saving = false;
				}
			});
		}
	}

	download(row: EvalRow): void {
		if (row.type !== 'document' || !row.fileName) return;
		this.documentsService.download(row.thesisId, row.id).subscribe({
			next: (blob) => {
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = row.fileName || 'dokument';
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				window.URL.revokeObjectURL(url);
			},
			error: (err) => console.error('Download failed', err)
		});
	}

	openChat(thesisId: string): void {
		this.chatService.openChat(thesisId);
	}
}
