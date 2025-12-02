import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { ConsultationsService } from '../../services/consultations.service';
import { ConsultationSlot } from '../../models/consultation';
import { AuthService } from '../../services/auth.service';
import { ThesesService } from '../../services/theses.service';

@Component({
	selector: 'app-student-consultations',
	standalone: true,
	imports: [CommonModule, FormsModule, MatTableModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule, MatIconModule],
	template: `
		<h3>Konsultacje</h3>
		@if (loading()) {
			<mat-spinner style="margin: 20px auto;"></mat-spinner>
		} @else if (!promoterId) {
			<div style="text-align: center; padding: 20px;">
				<p>Nie przypisano jeszcze tematu pracy dyplomowej, więc nie można umówić konsultacji.</p>
			</div>
		} @else {
			<mat-form-field appearance="outline" style="width:280px; margin-bottom: 12px;">
				<mat-label>Filtr (YYYY-MM)</mat-label>
				<input matInput [(ngModel)]="monthFilter" placeholder="2025-01" />
			</mat-form-field>
			<table mat-table [dataSource]="filteredSlots()" class="mat-elevation-z1" style="width:100%;">
				<ng-container matColumnDef="date">
					<th mat-header-cell *matHeaderCellDef>Termin</th>
					<td mat-cell *matCellDef="let s">{{ formatDateTime(s.startTime) }} - {{ formatDateTime(s.endTime) }}</td>
				</ng-container>
				<ng-container matColumnDef="capacity">
					<th mat-header-cell *matHeaderCellDef>Miejsca</th>
					<td mat-cell *matCellDef="let s">{{ s.registeredStudentIds.length }}/{{ s.capacity }}</td>
				</ng-container>
				<ng-container matColumnDef="actions">
					<th mat-header-cell *matHeaderCellDef>Akcje</th>
					<td mat-cell *matCellDef="let s">
						<button mat-icon-button (click)="downloadICS(s)" title="Pobierz .ics">
							<mat-icon>calendar_today</mat-icon>
						</button>
						<button mat-button color="primary" (click)="book(s)" [disabled]="s.registeredStudentIds.length >= s.capacity || isBooked(s) || saving()">Zapisz się</button>
						<button mat-button color="warn" (click)="cancel(s)" [disabled]="!isBooked(s) || saving()">Wypisz się</button>
					</td>
				</ng-container>
				<tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
				<tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
			</table>
		}
	`
})
export class StudentConsultationsComponent implements OnInit {
	displayedColumns = ['date', 'capacity', 'actions']
	monthFilter = '';
	slots = signal<ConsultationSlot[]>([]);
	loading = signal(false);
	saving = signal(false);
	promoterId: string | null = null;
	studentId = '';

	constructor(
		private readonly consultationsService: ConsultationsService,
		private readonly auth: AuthService,
		private readonly thesesService: ThesesService
	) {}

	ngOnInit(): void {
		const user = this.auth.user();
		if (user && user.role === 'student') {
			this.studentId = user.id;
			this.loading.set(true);
			this.thesesService.getByStudentId(user.id).subscribe({
				next: (thesis) => {
					if (thesis && thesis.promoterId) {
						this.promoterId = thesis.promoterId;
						this.loadSlots();
					} else {
						this.loading.set(false);
					}
				},
				error: () => {
					this.loading.set(false);
				}
			});
		}
	}

	loadSlots(): void {
		if (!this.promoterId) return;
		this.loading.set(true);
		this.consultationsService.listForPromoter(this.promoterId).subscribe({
			next: (slots) => {
				this.slots.set(slots);
				this.loading.set(false);
			},
			error: (err) => {
				console.error('Failed to load consultations', err);
				this.loading.set(false);
			}
		});
	}

	filteredSlots() {
		let list = this.slots();
		if (this.monthFilter) {
			list = list.filter(s => s.startTime.startsWith(this.monthFilter));
		}
		// Sort by date
		return list.sort((a, b) => a.startTime.localeCompare(b.startTime));
	}

	isBooked(slot: ConsultationSlot): boolean {
		return slot.registeredStudentIds.includes(this.studentId);
	}

	book(slot: ConsultationSlot): void {
		if (!confirm('Czy na pewno zapisać się na ten termin?')) return;
		this.saving.set(true);
		this.consultationsService.book(slot.id, this.studentId).subscribe({
			next: () => {
				this.loadSlots();
				this.saving.set(false);
			},
			error: () => this.saving.set(false)
		});
	}

	cancel(slot: ConsultationSlot): void {
		if (!confirm('Czy na pewno wypisać się z tego terminu?')) return;
		this.saving.set(true);
		this.consultationsService.cancel(slot.id, this.studentId).subscribe({
			next: () => {
				this.loadSlots();
				this.saving.set(false);
			},
			error: () => this.saving.set(false)
		});
	}

    formatDateTime(dateStr: string): string {
        return dateStr ? dateStr.replace('T', ' ') : '';
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
