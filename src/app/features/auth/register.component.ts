import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule, MatCardHeader, MatCardContent, MatCardActions } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';
import { UserRole } from '../../models/user';

@Component({
	selector: 'app-register',
	standalone: true,
	imports: [CommonModule, FormsModule, RouterModule, MatCardModule, MatCardHeader, MatCardContent, MatCardActions, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule],
	template: `
		<div class="register-container">
			<mat-card class="register-card">
				<mat-card-header>
					<div class="register-header">
						<mat-icon>school</mat-icon>
						<h1>Rejestracja</h1>
					</div>
				</mat-card-header>
				<mat-card-content>
					<form (ngSubmit)="register()" class="register-form">
						<div *ngIf="error" class="error-message">
							{{ error }}
						</div>

						<mat-form-field appearance="outline">
							<mat-label>Imię i nazwisko</mat-label>
							<input matInput [(ngModel)]="name" name="name" required minlength="2">
						</mat-form-field>

						<mat-form-field appearance="outline">
							<mat-label>Email</mat-label>
							<input matInput [(ngModel)]="email" name="email" required type="email">
						</mat-form-field>

						<mat-form-field appearance="outline">
							<mat-label>Hasło</mat-label>
							<input matInput [(ngModel)]="password" name="password" required type="password" minlength="6">
						</mat-form-field>

						<mat-form-field appearance="outline">
							<mat-label>Rola</mat-label>
							<mat-select [(ngModel)]="role" name="role" required>
								<mat-option value="student">Student</mat-option>
								<mat-option value="promoter">Promotor</mat-option>
								<mat-option value="admin">Administrator</mat-option>
							</mat-select>
						</mat-form-field>

						<button mat-raised-button color="primary" type="submit" class="register-button" [disabled]="loading">
							<mat-icon>person_add</mat-icon>
							<span>{{ loading ? 'Rejestracja...' : 'Zarejestruj się' }}</span>
						</button>
					</form>
				</mat-card-content>
				<mat-card-actions align="end">
					<a routerLink="/login" mat-button>Masz już konto? Zaloguj się</a>
				</mat-card-actions>
			</mat-card>
		</div>
	`,
	styles: [`
		.register-container {
			display: flex;
			justify-content: center;
			align-items: center;
			min-height: calc(100vh - 64px);
			padding: var(--spacing-lg);
		}

		.register-card {
			width: 100%;
			max-width: 400px;
		}

		.register-header {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: var(--spacing-md);
			text-align: center;
			padding: var(--spacing-lg) 0;

			mat-icon {
				font-size: 64px;
				width: 64px;
				height: 64px;
				color: var(--primary-700);
			}

			h1 {
				font-size: 24px;
				margin: 0;
				color: var(--primary-700);
			}
		}

		.register-form {
			display: flex;
			flex-direction: column;
			gap: var(--spacing-lg);
			padding: var(--spacing-lg) 0;
		}

		.register-button {
			width: 100%;
			height: 48px;
			display: flex;
			align-items: center;
			justify-content: center;
			gap: var(--spacing-sm);

			mat-icon {
				color: white;
			}
		}

		.error-message {
			color: var(--error-500);
			text-align: center;
			padding: var(--spacing-sm);
			background-color: var(--error-50);
			border-radius: 4px;
		}
	`]
})
export class RegisterComponent {
	name = '';
	email = '';
	password = '';
	role: UserRole = 'student';
	loading = false;
	error = '';

	constructor(private readonly router: Router, private readonly auth: AuthService) {}

	register(): void {
		if (!this.name || !this.email || !this.password || !this.role) return;

		this.loading = true;
		this.error = '';

		this.auth.register({
			name: this.name,
			email: this.email,
			password: this.password,
			role: this.role
		}).subscribe({
			next: () => {
				this.router.navigate(['/login']);
			},
			error: (err) => {
				this.loading = false;
				console.error(err);
				if (err.status === 409) {
					this.error = 'Użytkownik z tym adresem email już istnieje';
				} else {
					this.error = 'Błąd rejestracji. Spróbuj ponownie.';
				}
			}
		});
	}
}

