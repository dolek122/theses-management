import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { UsersService } from '../../services/users.service';
import { ApiService } from '../../services/api.service';

export interface StudentWithThesis {
	id: string;
	name: string;
	email: string;
	thesisId?: string;
	thesisTitle?: string;
	tasksCount?: number;
	completedTasksCount?: number;
	documentsCount?: number;
	averageGrade?: number;
}

@Component({
	selector: 'app-promoter-students',
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		RouterLink,
		MatTableModule,
		MatCardModule,
		MatButtonModule,
		MatProgressSpinnerModule,
		MatChipsModule,
		MatIconModule,
		MatFormFieldModule,
		MatInputModule
	],
	template: `
		<mat-card>
			<mat-card-header>
				<h3>Lista studentów</h3>
			</mat-card-header>
			<mat-card-content>
				<div style="margin-bottom: 16px;">
					<mat-form-field appearance="outline" style="width: 300px;">
						<mat-label>Szukaj studenta</mat-label>
						<input matInput [(ngModel)]="searchTerm" (input)="filterStudents()" placeholder="Imię, nazwisko, email..." />
						<mat-icon matPrefix>search</mat-icon>
					</mat-form-field>
				</div>

				@if (loading) {
					<mat-spinner style="margin: 20px auto;"></mat-spinner>
				} @else if (filteredStudents.length === 0) {
					<div style="text-align: center; padding: 40px; color: var(--text-secondary);">
						<mat-icon style="font-size: 48px; width: 48px; height: 48px; margin-bottom: 16px;">people_outline</mat-icon>
						<p>Brak studentów do wyświetlenia</p>
					</div>
				} @else {
					<table mat-table [dataSource]="filteredStudents" class="mat-elevation-z1" style="width:100%;">
						<ng-container matColumnDef="name">
							<th mat-header-cell *matHeaderCellDef>Student</th>
							<td mat-cell *matCellDef="let s">
								<div style="display: flex; flex-direction: column;">
									<span style="font-weight: 500;">{{ s.name }}</span>
									<span style="font-size: 12px; color: var(--text-secondary);">{{ s.email }}</span>
								</div>
							</td>
						</ng-container>
						<ng-container matColumnDef="thesis">
							<th mat-header-cell *matHeaderCellDef>Praca dyplomowa</th>
							<td mat-cell *matCellDef="let s">
								@if (s.thesisTitle) {
									<span>{{ s.thesisTitle }}</span>
								} @else {
									<span style="color: var(--text-secondary); font-style: italic;">Brak przypisanej pracy</span>
								}
							</td>
						</ng-container>
						<ng-container matColumnDef="progress">
							<th mat-header-cell *matHeaderCellDef>Postęp</th>
							<td mat-cell *matCellDef="let s">
								@if (s.tasksCount !== undefined && s.tasksCount > 0) {
									<div style="display: flex; flex-direction: column; gap: 4px;">
										<span style="font-size: 12px;">
											Zadania: {{ s.completedTasksCount || 0 }} / {{ s.tasksCount }}
										</span>
										<div style="width: 100%; height: 8px; background: var(--bg-secondary); border-radius: 4px; overflow: hidden;">
											<div [style.width.%]="((s.completedTasksCount || 0) / s.tasksCount * 100)" 
												 style="height: 100%; background: var(--primary-500); transition: width 0.3s;"></div>
										</div>
									</div>
								} @else {
									<span style="color: var(--text-secondary);">Brak danych</span>
								}
							</td>
						</ng-container>
						<ng-container matColumnDef="stats">
							<th mat-header-cell *matHeaderCellDef>Statystyki</th>
							<td mat-cell *matCellDef="let s">
								<div style="display: flex; flex-direction: column; gap: 4px; font-size: 12px;">
									@if (s.documentsCount !== undefined) {
										<span>Dokumenty: {{ s.documentsCount }}</span>
									}
									@if (s.averageGrade !== undefined && s.averageGrade !== null) {
										<span style="font-weight: 500; color: var(--primary-700);">
											Średnia ocena: {{ s.averageGrade }}
										</span>
									}
								</div>
							</td>
						</ng-container>
						<ng-container matColumnDef="actions">
							<th mat-header-cell *matHeaderCellDef>Akcje</th>
							<td mat-cell *matCellDef="let s">
								@if (s.thesisId) {
									<button mat-button color="primary" [routerLink]="['/promoter/student-link']" [queryParams]="{thesisId: s.thesisId}">
										<mat-icon>edit</mat-icon>
										Zarządzaj
									</button>
								} @else {
									<button mat-button [routerLink]="['/promoter/student-link']">
										<mat-icon>link</mat-icon>
										Przypisz pracę
									</button>
								}
							</td>
						</ng-container>

						<tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
						<tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
					</table>
				}
			</mat-card-content>
		</mat-card>
	`
})
export class PromoterStudentsComponent implements OnInit {
	displayedColumns = ['name', 'thesis', 'progress', 'stats', 'actions'];
	students: StudentWithThesis[] = [];
	filteredStudents: StudentWithThesis[] = [];
	loading = false;
	searchTerm = '';
	promoterId = localStorage.getItem('promoterId') || '1';

	constructor(
		private readonly api: ApiService
	) {}

	ngOnInit(): void {
		this.loadStudents();
	}

	loadStudents(): void {
		this.loading = true;
		this.api.get<StudentWithThesis[]>(`/users/students/with-thesis?promoterId=${this.promoterId}`).subscribe({
			next: (students) => {
				this.students = students;
				this.filteredStudents = students;
				this.loading = false;
			},
			error: (err) => {
				console.error('Failed to load students', err);
				this.loading = false;
			}
		});
	}

	filterStudents(): void {
		if (!this.searchTerm.trim()) {
			this.filteredStudents = this.students;
			return;
		}

		const term = this.searchTerm.toLowerCase();
		this.filteredStudents = this.students.filter(s =>
			s.name.toLowerCase().includes(term) ||
			s.email.toLowerCase().includes(term) ||
			(s.thesisTitle && s.thesisTitle.toLowerCase().includes(term))
		);
	}
}

