import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule, MatCardHeader, MatCardContent, MatCardActions } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';

@Component({
	selector: 'app-login',
	standalone: true,
	imports: [CommonModule, FormsModule, RouterModule, MatCardModule, MatCardHeader, MatCardContent, MatCardActions, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
	template: `
		<div class="login-container">
			<mat-card class="login-card">
				<mat-card-header>
					<div class="login-header">
						<mat-icon>school</mat-icon>
						<h1>System Zarządzania Pracami Dyplomowymi</h1>
					</div>
				</mat-card-header>
				<mat-card-content>
					<form (ngSubmit)="login()" class="login-form">
						<div *ngIf="error" class="error-message">
							{{ error }}
						</div>

						<mat-form-field appearance="outline">
							<mat-label>Email</mat-label>
							<input matInput [(ngModel)]="email" name="email" required type="email">
						</mat-form-field>

						<mat-form-field appearance="outline">
							<mat-label>Hasło</mat-label>
							<input matInput [(ngModel)]="password" name="password" required type="password">
						</mat-form-field>

						<button mat-raised-button color="primary" type="submit" class="login-button" [disabled]="loading">
							<mat-icon>login</mat-icon>
							<span>{{ loading ? 'Logowanie...' : 'Zaloguj się' }}</span>
						</button>
					</form>
				</mat-card-content>
				<mat-card-actions align="end">
					<a routerLink="/register" mat-button>Zarejestruj się</a>
				</mat-card-actions>
			</mat-card>
		</div>
	`,
	styles: [`
		.login-container {
			display: flex;
			justify-content: center;
			align-items: center;
			min-height: calc(100vh - 64px);
			padding: var(--spacing-lg);
		}

		.login-card {
			width: 100%;
			max-width: 400px;
		}

		.login-header {
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

		.login-form {
			display: flex;
			flex-direction: column;
			gap: var(--spacing-lg);
			padding: var(--spacing-lg) 0;
		}

		.login-button {
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
export class LoginComponent {
	email = '';
	password = '';
	loading = false;
	error = '';

	constructor(private readonly router: Router, private readonly auth: AuthService) {}

	login(): void {
		if (!this.email || !this.password) return;

		this.loading = true;
		this.error = '';

		this.auth.login(this.email, this.password).subscribe({
			next: () => {
				const role = this.auth.role();
				if (role) {
					this.router.navigate([role, 'dashboard']);
				}
			},
			error: (err) => {
				this.loading = false;
				console.error(err);
				this.error = 'Nieprawidłowy email lub hasło';
			}
		});
	}
}
