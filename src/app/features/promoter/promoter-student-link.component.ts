import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ThesesService } from '../../services/theses.service';
import { UsersService } from '../../services/users.service';
import { AuthService } from '../../services/auth.service';
import { Thesis } from '../../models/thesis';
import { User } from '../../models/user';

@Component({
	selector: 'app-promoter-student-link',
	standalone: true,
	imports: [CommonModule, FormsModule, MatTableModule, MatFormFieldModule, MatSelectModule, MatButtonModule, MatProgressSpinnerModule],
	template: `
		<h3>Powiązanie dyplomanta i recenzenta z pracą</h3>
		@if (loading) {
			<mat-spinner style="margin: 20px auto;"></mat-spinner>
		} @else {
			<table mat-table [dataSource]="theses" class="mat-elevation-z1" style="width:100%;">
				<ng-container matColumnDef="title">
					<th mat-header-cell *matHeaderCellDef>Praca</th>
					<td mat-cell *matCellDef="let t">{{ t.title }}</td>
				</ng-container>
				<ng-container matColumnDef="student">
					<th mat-header-cell *matHeaderCellDef>Student</th>
					<td mat-cell *matCellDef="let t">
						<mat-form-field appearance="outline" style="width:200px; margin-bottom: -1.25em">
							<mat-select [(ngModel)]="t.studentId" name="student-{{t.id}}">
								<mat-option [value]="undefined">— brak —</mat-option>
								@for (s of students; track s.id) {
									<mat-option [value]="s.id">{{ s.name }}</mat-option>
								}
							</mat-select>
						</mat-form-field>
					</td>
				</ng-container>
				<ng-container matColumnDef="reviewer">
					<th mat-header-cell *matHeaderCellDef>Recenzent</th>
					<td mat-cell *matCellDef="let t">
						<mat-form-field appearance="outline" style="width:200px; margin-bottom: -1.25em">
							<mat-select [(ngModel)]="t.reviewerId" name="reviewer-{{t.id}}">
								<mat-option [value]="undefined">— brak —</mat-option>
								@for (r of reviewers; track r.id) {
									<mat-option [value]="r.id">{{ r.name }}</mat-option>
								}
							</mat-select>
						</mat-form-field>
					</td>
				</ng-container>
				<ng-container matColumnDef="actions">
					<th mat-header-cell *matHeaderCellDef>Akcje</th>
					<td mat-cell *matCellDef="let t">
						<button mat-button color="primary" (click)="save(t)" [disabled]="saving">Zapisz</button>
					</td>
				</ng-container>
				<tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
				<tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
			</table>
		}
	`
})
export class PromoterStudentLinkComponent implements OnInit {
	displayedColumns = ['title', 'student', 'reviewer', 'actions'];
	students: User[] = [];
	reviewers: User[] = [];
	theses: Thesis[] = [];
	loading = false;
	saving = false;
	promoterId = '';

	constructor(
		private readonly thesesService: ThesesService,
		private readonly usersService: UsersService,
		private readonly auth: AuthService
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
		this.thesesService.list().subscribe({
			next: (theses) => {
				this.theses = theses.filter(t => t.promoterId === this.promoterId);
				this.loading = false;
			},
			error: (err) => {
				console.error('Failed to load theses', err);
				this.loading = false;
			}
		});
		this.usersService.list('student').subscribe({
			next: (students) => {
				this.students = students;
			},
			error: (err) => console.error('Failed to load students', err)
		});
		this.usersService.list('reviewer').subscribe({
			next: (reviewers) => {
				this.reviewers = reviewers;
			},
			error: (err) => console.error('Failed to load reviewers', err)
		});
	}

	save(thesis: Thesis): void {
		this.saving = true;
		
		// Sequentially update student and reviewer
		// In a real app, you might want a single endpoint for this or Promise.all
		const updateStudent = this.thesesService.assignStudent(thesis.id, thesis.studentId || null);
		
		updateStudent.subscribe({
			next: () => {
				// After student is updated, update reviewer
				this.thesesService.assignReviewer(thesis.id, thesis.reviewerId || null).subscribe({
					next: () => {
						this.loadData();
						this.saving = false;
						// Optional: Show success toast
					},
					error: (err) => {
						console.error('Failed to assign reviewer', err);
						this.saving = false;
					}
				});
			},
			error: (err) => {
				console.error('Failed to assign student', err);
				this.saving = false;
			}
		});
	}
}
