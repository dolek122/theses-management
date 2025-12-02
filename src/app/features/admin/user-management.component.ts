import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { UsersService, UserCreateRequest, UserUpdateRequest } from '../../services/users.service';
import { User, UserRole } from '../../models/user';

@Component({
	selector: 'app-user-management',
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		MatTableModule,
		MatFormFieldModule,
		MatInputModule,
		MatSelectModule,
		MatButtonModule,
		MatProgressSpinnerModule,
		MatCardModule,
		MatIconModule
	],
	template: `
		<mat-card>
			<mat-card-header>
				<h3>Zarządzanie użytkownikami</h3>
			</mat-card-header>
			<mat-card-content>
				<div style="margin-bottom: 24px;">
					<h4>{{ isEditing ? 'Edytuj użytkownika' : 'Dodaj nowego użytkownika' }}</h4>
					<form (ngSubmit)="saveUser()" style="display:grid; grid-template-columns: 1fr 1fr 1fr 1fr 120px; gap:12px; align-items:end;">
						<mat-form-field appearance="outline">
							<mat-label>Imię i nazwisko</mat-label>
							<input matInput [(ngModel)]="currentUser.name" name="name" required />
						</mat-form-field>
						<mat-form-field appearance="outline">
							<mat-label>Email</mat-label>
							<input matInput type="email" [(ngModel)]="currentUser.email" name="email" required />
						</mat-form-field>
						<mat-form-field appearance="outline">
							<mat-label>Hasło {{ isEditing ? '(opcjonalne)' : '' }}</mat-label>
							<input matInput [(ngModel)]="currentUser.password" name="password" [required]="!isEditing" />
						</mat-form-field>
						<mat-form-field appearance="outline">
							<mat-label>Rola</mat-label>
							<mat-select [(ngModel)]="currentUser.role" name="role" required>
								<mat-option value="student">Student</mat-option>
								<mat-option value="promoter">Promotor</mat-option>
								<mat-option value="reviewer">Recenzent</mat-option>
								<mat-option value="admin">Administrator</mat-option>
							</mat-select>
						</mat-form-field>
						<div style="display:flex; gap:8px;">
							<button mat-raised-button color="primary" type="submit" [disabled]="saving">
								{{ isEditing ? 'Zapisz' : 'Dodaj' }}
							</button>
							<button *ngIf="isEditing" mat-button type="button" (click)="cancelEdit()">Anuluj</button>
						</div>
					</form>
				</div>

				@if (loading) {
					<mat-spinner style="margin: 20px auto;"></mat-spinner>
				} @else {
					<div style="margin-bottom: 12px;">
						<mat-form-field appearance="outline" style="width: 200px;">
							<mat-label>Filtruj po roli</mat-label>
							<mat-select [(ngModel)]="selectedRole" (selectionChange)="loadUsers()">
								<mat-option [value]="undefined">Wszyscy</mat-option>
								<mat-option value="student">Studenci</mat-option>
								<mat-option value="promoter">Promotorzy</mat-option>
								<mat-option value="reviewer">Recenzenci</mat-option>
								<mat-option value="admin">Administratorzy</mat-option>
							</mat-select>
						</mat-form-field>
					</div>

					<table mat-table [dataSource]="users" class="mat-elevation-z1" style="width:100%;">
						<ng-container matColumnDef="name">
							<th mat-header-cell *matHeaderCellDef>Imię i nazwisko</th>
							<td mat-cell *matCellDef="let u">{{ u.name }}</td>
						</ng-container>
						<ng-container matColumnDef="email">
							<th mat-header-cell *matHeaderCellDef>Email</th>
							<td mat-cell *matCellDef="let u">{{ u.email }}</td>
						</ng-container>
						<ng-container matColumnDef="role">
							<th mat-header-cell *matHeaderCellDef>Rola</th>
							<td mat-cell *matCellDef="let u">
								{{ u.role === 'student' ? 'Student' : u.role === 'promoter' ? 'Promotor' : u.role === 'reviewer' ? 'Recenzent' : 'Administrator' }}
							</td>
						</ng-container>
						<ng-container matColumnDef="actions">
							<th mat-header-cell *matHeaderCellDef>Akcje</th>
							<td mat-cell *matCellDef="let u">
								<button mat-icon-button color="primary" (click)="editUser(u)">
									<mat-icon>edit</mat-icon>
								</button>
								<button mat-icon-button color="warn" (click)="removeUser(u.id)" [disabled]="saving">
									<mat-icon>delete</mat-icon>
								</button>
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
export class UserManagementComponent implements OnInit {
	displayedColumns = ['name', 'email', 'role', 'actions'];
	users: User[] = [];
	loading = false;
	saving = false;
	selectedRole?: UserRole;
	
	isEditing = false;
	currentUser: UserCreateRequest & { id?: string } = {
		name: '',
		email: '',
		role: 'student',
		password: ''
	};

	constructor(private readonly usersService: UsersService) {}

	ngOnInit(): void {
		this.loadUsers();
	}

	loadUsers(): void {
		this.loading = true;
		this.usersService.list(this.selectedRole).subscribe({
			next: (users) => {
				this.users = users;
				this.loading = false;
			},
			error: (err) => {
				console.error('Failed to load users', err);
				this.loading = false;
			}
		});
	}

	saveUser(): void {
		if (!this.currentUser.name || !this.currentUser.email || !this.currentUser.role) {
			return;
		}

		this.saving = true;
		
		if (this.isEditing && this.currentUser.id) {
			const update: UserUpdateRequest = {
				name: this.currentUser.name,
				email: this.currentUser.email,
				role: this.currentUser.role
			};
			if (this.currentUser.password) {
				update.password = this.currentUser.password;
			}
			
			this.usersService.update(this.currentUser.id, update).subscribe({
				next: () => {
					this.resetForm();
					this.loadUsers();
					this.saving = false;
				},
				error: (err) => {
					console.error(err);
					this.saving = false;
					alert('Błąd edycji użytkownika');
				}
			});
		} else {
			if (!this.currentUser.password) {
				this.saving = false;
				return; // Should be handled by [required] in template
			}
			this.usersService.create({
				name: this.currentUser.name,
				email: this.currentUser.email,
				role: this.currentUser.role,
				password: this.currentUser.password
			}).subscribe({
				next: () => {
					this.resetForm();
					this.loadUsers();
					this.saving = false;
					alert('Użytkownik został dodany pomyślnie!');
				},
				error: (err) => {
					console.error('Failed to create user', err);
					if (err.status === 409) {
						alert('Użytkownik z tym emailem już istnieje!');
					} else {
						alert('Nie udało się dodać użytkownika. Spróbuj ponownie.');
					}
					this.saving = false;
				}
			});
		}
	}
	
	editUser(user: User): void {
		this.isEditing = true;
		this.currentUser = {
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
			password: ''
		};
	}
	
	cancelEdit(): void {
		this.resetForm();
	}
	
	resetForm(): void {
		this.isEditing = false;
		this.currentUser = {
			name: '',
			email: '',
			role: 'student',
			password: ''
		};
	}

	removeUser(id: string): void {
		if (!confirm('Czy na pewno chcesz usunąć tego użytkownika?')) {
			return;
		}

		this.saving = true;
		this.usersService.delete(id).subscribe({
			next: () => {
				this.loadUsers();
				this.saving = false;
			},
			error: (err) => {
				console.error('Failed to delete user', err);
				alert('Nie udało się usunąć użytkownika. Spróbuj ponownie.');
				this.saving = false;
			}
		});
	}
}
