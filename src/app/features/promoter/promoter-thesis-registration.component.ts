import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { ThesesService } from '../../services/theses.service';
import { Thesis } from '../../models/thesis';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';

@Component({
	selector: 'app-promoter-thesis-registration',
	standalone: true,
	imports: [CommonModule, FormsModule, MatTableModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatProgressSpinnerModule, MatIconModule],
	template: `
		<h3>Rejestracja pracy w systemie</h3>
		@if (loading) {
			<mat-spinner style="margin: 20px auto;"></mat-spinner>
		} @else {
			<form (ngSubmit)="saveThesis()" style="display:grid; grid-template-columns: 1fr 2fr 160px; gap:12px; align-items:end; margin-bottom:16px;">
				<mat-form-field appearance="outline">
					<mat-label>Tytuł</mat-label>
					<input matInput [(ngModel)]="currentThesis.title" name="title" required minlength="3" maxlength="200" #titleInput="ngModel"/>
					<mat-error *ngIf="titleInput.invalid">Min. 3 znaki</mat-error>
				</mat-form-field>
				<mat-form-field appearance="outline">
					<mat-label>Opis</mat-label>
					<input matInput [(ngModel)]="currentThesis.description" name="description" required minlength="10" maxlength="2000" #descInput="ngModel"/>
					<mat-error *ngIf="descInput.invalid">Min. 10 znaków</mat-error>
				</mat-form-field>
				
				<div style="display: flex; gap: 8px;">
					<button mat-raised-button color="primary" type="submit" [disabled]="saving || titleInput.invalid || descInput.invalid">
						{{ isEditing ? 'Zapisz' : 'Zarejestruj' }}
					</button>
					<button *ngIf="isEditing" mat-button type="button" (click)="cancelEdit()">Anuluj</button>
				</div>
			</form>

			<table mat-table [dataSource]="theses" class="mat-elevation-z1" style="width:100%;">
				<ng-container matColumnDef="title">
					<th mat-header-cell *matHeaderCellDef>Tytuł</th>
					<td mat-cell *matCellDef="let t">{{ t.title }}</td>
				</ng-container>
				<ng-container matColumnDef="description">
					<th mat-header-cell *matHeaderCellDef>Opis</th>
					<td mat-cell *matCellDef="let t">{{ t.description }}</td>
				</ng-container>
				<ng-container matColumnDef="actions">
					<th mat-header-cell *matHeaderCellDef>Akcje</th>
					<td mat-cell *matCellDef="let t">
						<button mat-icon-button color="accent" (click)="openChat(t.id)" title="Otwórz czat">
							<mat-icon>chat</mat-icon>
						</button>
						<button mat-icon-button color="primary" (click)="editThesis(t)">
							<mat-icon>edit</mat-icon>
						</button>
						<button mat-icon-button color="warn" (click)="removeThesis(t.id)" [disabled]="saving">
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
export class PromoterThesisRegistrationComponent implements OnInit {
	displayedColumns = ['title', 'description', 'actions'];
	theses: Thesis[] = [];
	loading = false;
	saving = false;
	promoterId = '';
	
	currentThesis = { id: '', title: '', description: '' };
	isEditing = false;

	constructor(
		private readonly thesesService: ThesesService,
		private readonly auth: AuthService,
		private readonly chatService: ChatService
	) {}

	ngOnInit(): void {
		const user = this.auth.user();
		if (user && user.role === 'promoter') {
			this.promoterId = user.id;
			this.loadTheses();
		}
	}

	openChat(thesisId: string): void {
		this.chatService.openChat(thesisId);
	}

	loadTheses(): void {
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
	}

	saveThesis(): void {
		if (!this.currentThesis.title || !this.currentThesis.description) return;
		this.saving = true;
		
		if (this.isEditing && this.currentThesis.id) {
			this.thesesService.update(this.currentThesis.id, {
				title: this.currentThesis.title,
				description: this.currentThesis.description
			}).subscribe({
				next: () => {
					this.cancelEdit();
					this.loadTheses();
					this.saving = false;
				},
				error: (err) => {
					console.error(err);
					this.saving = false;
				}
			});
		} else {
			this.thesesService.create({
				title: this.currentThesis.title,
				description: this.currentThesis.description,
				promoterId: this.promoterId
			}).subscribe({
				next: () => {
					this.currentThesis = { id: '', title: '', description: '' };
					this.loadTheses();
					this.saving = false;
				},
				error: (err) => {
					console.error('Failed to create thesis', err);
					this.saving = false;
				}
			});
		}
	}
	
	editThesis(t: Thesis): void {
		this.currentThesis = {
			id: t.id,
			title: t.title,
			description: t.description
		};
		this.isEditing = true;
	}
	
	cancelEdit(): void {
		this.currentThesis = { id: '', title: '', description: '' };
		this.isEditing = false;
	}

	removeThesis(id: string): void {
		if (!confirm('Czy na pewno usunąć pracę?')) return;
		this.saving = true;
		this.thesesService.remove(id).subscribe({
			next: () => {
				this.loadTheses();
				this.saving = false;
			},
			error: (err) => {
				console.error('Failed to remove thesis', err);
				this.saving = false;
			}
		});
	}
}
