import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { ConsultationsService } from '../../services/consultations.service';
import { ConsultationSlot } from '../../models/consultation';
import { AuthService } from '../../services/auth.service';
import { UsersService } from '../../services/users.service';
import { User } from '../../models/user';

@Component({
	selector: 'app-promoter-consultations',
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		MatTableModule,
		MatFormFieldModule,
		MatInputModule,
		MatButtonModule,
		MatProgressSpinnerModule,
		MatIconModule,
		MatCardModule,
		MatCheckboxModule,
		MatChipsModule,
		DatePipe
	],
	template: `
		<div class="container">
			<div class="header-actions">
				<h3>Terminy konsultacji</h3>
				<mat-checkbox [(ngModel)]="showPast" (change)="filterSlots()">Pokaż archiwalne</mat-checkbox>
			</div>

			<mat-card class="add-slot-card">
				<mat-card-header>
					<mat-card-title>Dodaj nowy termin</mat-card-title>
				</mat-card-header>
				<mat-card-content>
					<form (ngSubmit)="add()" class="add-form">
						<mat-form-field appearance="outline">
							<mat-label>Początek</mat-label>
							<input matInput type="datetime-local" [(ngModel)]="newSlot.startTime" name="startTime" required />
						</mat-form-field>
						<mat-form-field appearance="outline">
							<mat-label>Koniec</mat-label>
							<input matInput type="datetime-local" [(ngModel)]="newSlot.endTime" name="endTime" required />
						</mat-form-field>
						<mat-form-field appearance="outline" class="capacity-field">
							<mat-label>Miejsca</mat-label>
							<input matInput type="number" min="1" [(ngModel)]="newSlot.capacity" name="capacity" required />
						</mat-form-field>
						<mat-form-field appearance="outline" class="notes-field">
							<mat-label>Notatki (opcjonalne)</mat-label>
							<input matInput type="text" [(ngModel)]="newSlot.notes" name="notes" />
						</mat-form-field>
						<button mat-raised-button color="primary" type="submit" [disabled]="saving" style="height: 56px;">
							<mat-icon>add</mat-icon> Dodaj
						</button>
					</form>
				</mat-card-content>
			</mat-card>

			@if (loading) {
				<mat-spinner style="margin: 20px auto;"></mat-spinner>
			} @else {
				<table mat-table [dataSource]="filteredSlots" class="mat-elevation-z2" style="width:100%; margin-top: 20px;">
					
					<!-- Date Column -->
					<ng-container matColumnDef="date">
						<th mat-header-cell *matHeaderCellDef> Termin </th>
						<td mat-cell *matCellDef="let s">
							<div class="date-cell">
								<span class="date-day">{{ s.startTime | date:'EEEE, dd.MM.yyyy' }}</span>
								<span class="date-time">{{ s.startTime | date:'HH:mm' }} - {{ s.endTime | date:'HH:mm' }}</span>
							</div>
						</td>
					</ng-container>

					<!-- Capacity Column -->
					<ng-container matColumnDef="capacity">
						<th mat-header-cell *matHeaderCellDef> Miejsca </th>
						<td mat-cell *matCellDef="let s">
							<span [class.full-capacity]="s.registeredStudentIds.length >= s.capacity">
								{{ s.registeredStudentIds.length }} / {{ s.capacity }}
							</span>
						</td>
					</ng-container>

					<!-- Students Column -->
					<ng-container matColumnDef="students">
						<th mat-header-cell *matHeaderCellDef> Zapisani studenci </th>
						<td mat-cell *matCellDef="let s">
							@if (s.registeredStudentIds.length === 0) {
								<span style="color: #999; font-style: italic;">Brak zapisów</span>
							}
							<mat-chip-set>
								@for (studentId of s.registeredStudentIds; track studentId) {
									<mat-chip>
										{{ getStudentName(studentId) }}
										<button matChipRemove (click)="removeStudent(s, studentId)" title="Wypisz studenta">
											<mat-icon>cancel</mat-icon>
										</button>
									</mat-chip>
								}
							</mat-chip-set>
						</td>
					</ng-container>

					<!-- Notes Column -->
					<ng-container matColumnDef="notes">
						<th mat-header-cell *matHeaderCellDef> Notatki </th>
						<td mat-cell *matCellDef="let s"> {{ s.notes || '-' }} </td>
					</ng-container>

					<!-- Actions Column -->
					<ng-container matColumnDef="actions">
						<th mat-header-cell *matHeaderCellDef> Akcje </th>
						<td mat-cell *matCellDef="let s">
							<button mat-icon-button color="primary" (click)="downloadICS(s)" title="Pobierz do kalendarza (.ics)">
								<mat-icon>calendar_today</mat-icon>
							</button>
							<button mat-icon-button color="warn" (click)="remove(s.id)" [disabled]="saving" title="Usuń termin">
								<mat-icon>delete</mat-icon>
							</button>
						</td>
					</ng-container>

					<tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
					<tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
				</table>

				@if (filteredSlots.length === 0) {
					<div class="empty-state">
						Brak zaplanowanych konsultacji.
					</div>
				}
			}
		</div>
	`,
	styles: [`
		.container { padding: 0; }
		.header-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
		.add-slot-card { margin-bottom: 24px; }
		.add-form { display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-start; }
		.add-form mat-form-field { flex: 1; min-width: 200px; }
		.capacity-field { flex: 0 0 100px; min-width: 100px; }
		.notes-field { flex: 2; min-width: 300px; }
		
		.date-cell { display: flex; flex-direction: column; }
		.date-day { font-weight: 500; }
		.date-time { color: #666; font-size: 0.9em; }
		
		.full-capacity { color: #d32f2f; font-weight: bold; }
		.empty-state { text-align: center; padding: 40px; color: #666; background: #f5f5f5; margin-top: 20px; border-radius: 4px; }
	`]
})
export class PromoterConsultationsComponent implements OnInit {
	displayedColumns = ['date', 'capacity', 'students', 'notes', 'actions'];
	allSlots: ConsultationSlot[] = [];
	filteredSlots: ConsultationSlot[] = [];
	studentsMap: Map<string, string> = new Map();
	loading = false;
	saving = false;
	promoterId = '';
	newSlot = { startTime: '', endTime: '', capacity: 1, notes: '' };
	showPast = false;

	constructor(
		private readonly consultationsService: ConsultationsService,
		private readonly auth: AuthService,
		private readonly usersService: UsersService
	) {}

	ngOnInit(): void {
		const user = this.auth.user();
		if (user && user.role === 'promoter') {
			this.promoterId = user.id;
			this.loadData();
		}
	}

	loadData(): void {
		this.loading = true;
		// Load students first to map names correctly
		this.usersService.list('student').subscribe({
			next: (students) => {
				students.forEach(s => this.studentsMap.set(s.id, s.name));
				this.loadSlots();
			},
			error: (err) => {
				console.error('Failed to load students', err);
				this.loadSlots(); // Try to load slots anyway
			}
		});
	}

	loadSlots(): void {
		this.consultationsService.listForPromoter(this.promoterId).subscribe({
			next: (slots) => {
				this.allSlots = slots.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
				this.filterSlots();
				this.loading = false;
			},
			error: (err) => {
				console.error('Failed to load consultations', err);
				this.loading = false;
			}
		});
	}

	filterSlots(): void {
		const now = new Date();
		if (this.showPast) {
			this.filteredSlots = [...this.allSlots];
		} else {
			this.filteredSlots = this.allSlots.filter(s => new Date(s.endTime) >= now);
		}
	}

	getStudentName(id: string): string {
		return this.studentsMap.get(id) || 'Nieznany student';
	}

	add(): void {
		if (!this.newSlot.startTime || !this.newSlot.endTime || !this.newSlot.capacity) return;
		this.saving = true;
		this.consultationsService.createSlot(this.promoterId, {
			promoterId: this.promoterId,
			startTime: this.newSlot.startTime,
			endTime: this.newSlot.endTime,
			capacity: this.newSlot.capacity,
			notes: this.newSlot.notes || undefined
		}).subscribe({
			next: () => {
				this.newSlot = { startTime: '', endTime: '', capacity: 1, notes: '' };
				this.loadSlots();
				this.saving = false;
			},
			error: (err) => {
				console.error('Failed to create slot', err);
				this.saving = false;
			}
		});
	}

	remove(id: string): void {
		if (!confirm('Czy na pewno usunąć termin?')) return;
		this.saving = true;
		this.consultationsService.removeSlot(this.promoterId, id).subscribe({
			next: () => {
				this.loadSlots();
				this.saving = false;
			},
			error: (err) => {
				console.error('Failed to remove slot', err);
				this.saving = false;
			}
		});
	}

	removeStudent(slot: ConsultationSlot, studentId: string): void {
		if (!confirm(`Czy na pewno wypisać studenta ${this.getStudentName(studentId)} z tego terminu?`)) return;
		this.consultationsService.cancel(slot.id, studentId).subscribe({
			next: () => {
				// Optimistically update UI
				slot.registeredStudentIds = slot.registeredStudentIds.filter(id => id !== studentId);
			},
			error: (err) => {
				console.error('Failed to remove student from slot', err);
				alert('Nie udało się wypisać studenta.');
			}
		});
	}

	downloadICS(slot: ConsultationSlot): void {
		const formatDate = (dateStr: string) => {
			return dateStr.replace(/[-:]/g, '').split('.')[0] + '00';
		};

		const start = formatDate(slot.startTime);
		const end = formatDate(slot.endTime);
		const now = formatDate(new Date().toISOString());

		const icsContent = [
			'BEGIN:VCALENDAR',
			'VERSION:2.0',
			'PRODID:-//ThesesManagement//CONSULTATIONS//PL',
			'BEGIN:VEVENT',
			`UID:${slot.id}@theses-management`,
			`DTSTAMP:${now}Z`,
			`DTSTART:${start}`,
			`DTEND:${end}`,
			'SUMMARY:Konsultacje dyplomowe',
			`DESCRIPTION:${slot.notes || 'Konsultacje w sprawie pracy dyplomowej'}`,
			'END:VEVENT',
			'END:VCALENDAR'
		].join('\r\n');

		const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `konsultacje-${slot.startTime.split('T')[0]}.ics`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		window.URL.revokeObjectURL(url);
	}
}
