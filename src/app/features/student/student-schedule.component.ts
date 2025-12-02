import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { ScheduleTasksService } from '../../services/schedule-tasks.service';
import { ScheduleTask } from '../../models/schedule';
import { AuthService } from '../../services/auth.service';
import { ThesesService } from '../../services/theses.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
	selector: 'app-student-schedule',
	standalone: true,
	imports: [CommonModule, FormsModule, MatTableModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatProgressSpinnerModule, MatIconModule, MatMenuModule],
	template: `
		<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
			<h3 style="margin:0">Harmonogram zadań</h3>
			<div style="display: flex; gap: 8px;">
				<button mat-raised-button color="accent" (click)="fileInput.click()">
					<mat-icon>upload_file</mat-icon> Importuj CSV
				</button>
				<input #fileInput type="file" (change)="importScheduleCSV($event)" style="display: none;" accept=".csv">
				
				<button mat-raised-button color="primary" [matMenuTriggerFor]="exportMenu" [disabled]="loading || tasks.length === 0">
					<mat-icon>download</mat-icon> Eksportuj
				</button>
			</div>
			<mat-menu #exportMenu="matMenu">
				<button mat-menu-item (click)="exportScheduleCSV()">
					<span>Eksportuj do CSV</span>
				</button>
				<button mat-menu-item (click)="exportSchedulePDF()">
					<span>Eksportuj do PDF</span>
				</button>
			</mat-menu>
		</div>
		@if (loading) {
			<mat-spinner style="margin: 20px auto;"></mat-spinner>
		} @else if (!thesisId) {
			<div style="text-align: center; padding: 20px;">
				<p>Nie przypisano jeszcze tematu pracy dyplomowej.</p>
			</div>
		} @else {
			<form (ngSubmit)="saveTask()" style="display:grid; grid-template-columns: 1fr 1fr 1fr 160px; gap:12px; align-items:end; margin-bottom:16px;">
				<mat-form-field appearance="outline">
					<mat-label>Nazwa zadania</mat-label>
					<input matInput [(ngModel)]="currentTask.name" name="name" required />
				</mat-form-field>
				<mat-form-field appearance="outline">
					<mat-label>Zakres</mat-label>
					<input matInput [(ngModel)]="currentTask.scope" name="scope" required />
				</mat-form-field>
				<mat-form-field appearance="outline">
					<mat-label>Termin (YYYY-MM-DD)</mat-label>
					<input matInput [(ngModel)]="currentTask.dueDate" name="dueDate" placeholder="2025-01-31" required />
				</mat-form-field>
				
				<div style="display: flex; gap: 8px;">
					<button mat-raised-button color="primary" type="submit" [disabled]="saving">
						{{ isEditing ? 'Zapisz' : 'Dodaj' }}
					</button>
					<button *ngIf="isEditing" mat-button type="button" (click)="cancelEdit()">Anuluj</button>
				</div>
			</form>

			<table mat-table [dataSource]="tasks" class="mat-elevation-z1" style="width:100%;">
				<ng-container matColumnDef="name">
					<th mat-header-cell *matHeaderCellDef>Nazwa</th>
					<td mat-cell *matCellDef="let t">{{ t.name }}</td>
				</ng-container>
				<ng-container matColumnDef="scope">
					<th mat-header-cell *matHeaderCellDef>Zakres</th>
					<td mat-cell *matCellDef="let t">{{ t.scope }}</td>
				</ng-container>
				<ng-container matColumnDef="dueDate">
					<th mat-header-cell *matHeaderCellDef>Termin</th>
					<td mat-cell *matCellDef="let t">{{ t.dueDate }}</td>
				</ng-container>
				<ng-container matColumnDef="status">
					<th mat-header-cell *matHeaderCellDef>Status</th>
					<td mat-cell *matCellDef="let t">
						<mat-form-field appearance="outline" style="width:140px; margin-bottom: -1.25em">
							<mat-select [(ngModel)]="t.status" name="status-{{t.id}}" (selectionChange)="onStatusChange(t)">
								<mat-option value="pending">Do zrobienia</mat-option>
								<mat-option value="in_review">Do oceny</mat-option>
								<mat-option value="completed">Zakończone</mat-option>
							</mat-select>
						</mat-form-field>
						<div *ngIf="t.comments" style="font-size: 0.85em; color: #d32f2f; margin-top: 4px;">
							<strong>Uwagi:</strong> {{ t.comments }}
						</div>
					</td>
				</ng-container>
				<ng-container matColumnDef="actions">
					<th mat-header-cell *matHeaderCellDef>Akcje</th>
					<td mat-cell *matCellDef="let t">
						<button mat-icon-button color="primary" (click)="editTask(t)">
							<mat-icon>edit</mat-icon>
						</button>
						<button mat-icon-button color="warn" (click)="removeTask(t.id)" [disabled]="saving">
							<mat-icon>delete</mat-icon>
						</button>
					</td>
				</ng-container>

				<tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
				<tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
			</table>
		}
	`
})
export class StudentScheduleComponent implements OnInit {
	displayedColumns = ['name', 'scope', 'dueDate', 'status', 'actions'];
	tasks: ScheduleTask[] = [];
	loading = false;
	saving = false;
	thesisId: string | null = null;
	
	currentTask = { id: '', name: '', scope: '', dueDate: '' };
	isEditing = false;

	constructor(
		private readonly scheduleService: ScheduleTasksService,
		private readonly auth: AuthService,
		private readonly thesesService: ThesesService
	) {}

	ngOnInit(): void {
		this.loadThesis();
	}
	
	loadThesis(): void {
		const user = this.auth.user();
		if (!user) return;
		
		this.loading = true;
		this.thesesService.getByStudentId(user.id).subscribe({
			next: (thesis) => {
				this.thesisId = thesis.id;
				this.loadTasks();
			},
			error: () => {
				this.loading = false;
				// No thesis found
			}
		});
	}

	loadTasks(): void {
		if (!this.thesisId) return;
		this.loading = true;
		this.scheduleService.list(this.thesisId).subscribe({
			next: (tasks) => {
				this.tasks = tasks;
				this.loading = false;
			},
			error: (err) => {
				console.error('Failed to load tasks', err);
				this.loading = false;
			}
		});
	}

	saveTask(): void {
		if (!this.thesisId || !this.currentTask.name || !this.currentTask.scope || !this.currentTask.dueDate) return;
		this.saving = true;
		
		if (this.isEditing && this.currentTask.id) {
			this.scheduleService.update(this.thesisId, this.currentTask.id, {
				name: this.currentTask.name,
				scope: this.currentTask.scope,
				dueDate: this.currentTask.dueDate
			}).subscribe({
				next: () => {
					this.cancelEdit();
					this.loadTasks();
					this.saving = false;
				},
				error: (err) => {
					console.error(err);
					this.saving = false;
				}
			});
		} else {
			this.createTask(this.currentTask.name, this.currentTask.scope, this.currentTask.dueDate);
		}
	}

	createTask(name: string, scope: string, dueDate: string): void {
		if (!this.thesisId) return;
		this.scheduleService.create(this.thesisId, {
			thesisId: this.thesisId,
			name: name,
			scope: scope,
			dueDate: dueDate
		}).subscribe({
			next: () => {
				this.currentTask = { id: '', name: '', scope: '', dueDate: '' };
				this.loadTasks();
				this.saving = false;
			},
			error: (err) => {
				console.error('Failed to create task', err);
				this.saving = false;
			}
		});
	}
	
	editTask(task: ScheduleTask): void {
		this.currentTask = {
			id: task.id,
			name: task.name,
			scope: task.scope,
			dueDate: task.dueDate
		};
		this.isEditing = true;
	}
	
	cancelEdit(): void {
		this.currentTask = { id: '', name: '', scope: '', dueDate: '' };
		this.isEditing = false;
	}

	removeTask(id: string): void {
		if (!this.thesisId) return;
		if (!confirm('Czy na pewno usunąć zadanie?')) return;
		this.saving = true;
		this.scheduleService.remove(this.thesisId, id).subscribe({
			next: () => {
				this.loadTasks();
				this.saving = false;
			},
			error: (err) => {
				console.error('Failed to remove task', err);
				this.saving = false;
			}
		});
	}

	onStatusChange(task: ScheduleTask): void {
		if (!this.thesisId) return;
		this.scheduleService.update(this.thesisId, task.id, { status: task.status }).subscribe({
			error: (err) => console.error('Failed to update task status', err)
		});
	}

	exportScheduleCSV(): void {
		if (!this.thesisId) return;
		this.scheduleService.export(this.thesisId).subscribe({
			next: (blob) => {
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = 'harmonogram.csv';
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				window.URL.revokeObjectURL(url);
			},
			error: (err) => console.error('Export failed', err)
		});
	}

	exportSchedulePDF(): void {
		const doc = new jsPDF();
		const col = ["Nazwa", "Zakres", "Termin", "Status", "Ocena", "Uwagi"];
		const rows: any[] = [];

		this.tasks.forEach(t => {
			const temp = [
				t.name,
				t.scope,
				t.dueDate,
				this.translateStatus(t.status),
				t.grade || '',
				t.comments || ''
			];
			rows.push(temp);
		});

		doc.setFont('helvetica', 'bold');
		doc.setFontSize(18);
		doc.text('Harmonogram Pracy Dyplomowej', 14, 22);
		doc.setFontSize(12);
		doc.setFont('helvetica', 'normal');

		autoTable(doc, {
			head: [col],
			body: rows,
			startY: 30,
			theme: 'grid',
			headStyles: { fillColor: [63, 81, 181] } // Primary color
		});

		doc.save('harmonogram.pdf');
	}

	importScheduleCSV(event: any): void {
		const file = event.target.files[0];
		if (!file || !this.thesisId) return;

		const reader = new FileReader();
		reader.onload = (e: any) => {
			const text = e.target.result;
			const lines = text.split('\n');
			// Assume CSV format: Name,Scope,DueDate
			// Skip header if exists (simple check)
			const startIndex = lines[0].toLowerCase().includes('nazwa') ? 1 : 0;

			let count = 0;
			for (let i = startIndex; i < lines.length; i++) {
				const line = lines[i].trim();
				if (!line) continue;
				
				const parts = line.split(',');
				if (parts.length >= 3) {
					// Very basic CSV parsing
					const name = parts[0].trim();
					const scope = parts[1].trim();
					const dueDate = parts[2].trim();
					
					if (name && scope && dueDate) {
						// Sequential creation to avoid overwhelming
						// In real app, use bulk create endpoint
						this.createTask(name, scope, dueDate);
						count++;
					}
				}
			}
			if (count > 0) {
				alert(`Zaimportowano ${count} zadań.`);
			}
		};
		reader.readAsText(file);
		// Reset input
		event.target.value = '';
	}

	translateStatus(status: string): string {
		switch(status) {
			case 'pending': return 'Do zrobienia';
			case 'in_review': return 'Do oceny';
			case 'completed': return 'Zakończone';
			default: return status;
		}
	}
}
