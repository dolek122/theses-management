import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { DocumentsService } from '../../services/documents.service';
import { ThesesService } from '../../services/theses.service';
import { AuthService } from '../../services/auth.service';
import { DocumentElement } from '../../models/document';
import { Thesis } from '../../models/thesis';

@Component({
	selector: 'app-promoter-remarks',
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		MatTableModule,
		MatFormFieldModule,
		MatInputModule,
		MatButtonModule,
		MatSelectModule,
		MatProgressSpinnerModule,
		MatCardModule,
		MatIconModule
	],
	template: `
		<div class="container">
			<h3>Uwagi do prac dyplomowych</h3>

			<mat-card class="selection-card">
				<mat-card-content>
					<mat-form-field appearance="outline" style="width: 100%;">
						<mat-label>Wybierz pracę dyplomową</mat-label>
						<mat-select [(ngModel)]="selectedThesisId" (selectionChange)="onThesisSelect()">
							@for (thesis of myTheses; track thesis.id) {
								<mat-option [value]="thesis.id">
									{{ thesis.title }} ({{ getStudentName(thesis) }})
								</mat-option>
							}
						</mat-select>
					</mat-form-field>
				</mat-card-content>
			</mat-card>

			@if (loading) {
				<mat-spinner style="margin: 20px auto;"></mat-spinner>
			} @else if (selectedThesisId && documents.length > 0) {
				<table mat-table [dataSource]="documents" class="mat-elevation-z2" style="width:100%; margin-top: 20px;">
					
					<!-- Document Name Column -->
					<ng-container matColumnDef="title">
						<th mat-header-cell *matHeaderCellDef> Dokument </th>
						<td mat-cell *matCellDef="let doc"> 
							<strong>{{ doc.title }}</strong>
							<div *ngIf="doc.fileName" style="font-size: 0.85em; color: gray;">{{ doc.fileName }}</div>
						</td>
					</ng-container>

					<!-- Status Column -->
					<ng-container matColumnDef="status">
						<th mat-header-cell *matHeaderCellDef> Status </th>
						<td mat-cell *matCellDef="let doc"> 
							<span [ngClass]="'status-' + doc.status">{{ doc.status }}</span>
						</td>
					</ng-container>

					<!-- Comment Column -->
					<ng-container matColumnDef="comment">
						<th mat-header-cell *matHeaderCellDef> Uwagi / Komentarz </th>
						<td mat-cell *matCellDef="let doc">
							<mat-form-field appearance="outline" style="width: 100%; margin-top: 8px;">
								<textarea matInput 
									[(ngModel)]="doc.comments" 
									placeholder="Wpisz uwagi do tego dokumentu..."
									rows="2"></textarea>
							</mat-form-field>
						</td>
					</ng-container>

					<!-- Actions Column -->
					<ng-container matColumnDef="actions">
						<th mat-header-cell *matHeaderCellDef> Akcje </th>
						<td mat-cell *matCellDef="let doc">
							<button mat-raised-button color="primary" (click)="saveRemark(doc)" [disabled]="saving">
								<mat-icon>save</mat-icon> Zapisz
							</button>
						</td>
					</ng-container>

					<tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
					<tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
				</table>
			} @else if (selectedThesisId) {
				<div class="empty-state">
					Brak dokumentów przypisanych do tej pracy. Student nie przesłał jeszcze żadnych plików.
				</div>
			} @else {
				<div class="empty-state">
					Wybierz pracę z listy powyżej, aby zarządzać uwagami.
				</div>
			}
		</div>
	`,
	styles: [`
		.container { padding: 0; }
		.selection-card { margin-bottom: 20px; }
		.empty-state { text-align: center; padding: 40px; color: #666; background: #f5f5f5; margin-top: 20px; border-radius: 4px; }
		.status-draft { color: gray; }
		.status-submitted { color: orange; font-weight: bold; }
		.status-reviewed { color: green; font-weight: bold; }
		textarea { resize: vertical; }
	`]
})
export class PromoterRemarksComponent implements OnInit {
	displayedColumns = ['title', 'status', 'comment', 'actions'];
	myTheses: Thesis[] = [];
	documents: DocumentElement[] = [];
	
	loading = false;
	saving = false;
	
	promoterId = '';
	selectedThesisId = '';

	constructor(
		private readonly thesesService: ThesesService,
		private readonly documentsService: DocumentsService,
		private readonly auth: AuthService
	) {}

	ngOnInit(): void {
		const user = this.auth.user();
		if (user && (user.role === 'promoter' || user.role === 'reviewer')) {
			this.promoterId = user.id;
			this.loadTheses();
		}
	}

	loadTheses(): void {
		this.loading = true;
		this.thesesService.list().subscribe({
			next: (theses) => {
				// Filter theses where user is promoter or reviewer
				this.myTheses = theses.filter(t => t.promoterId === this.promoterId || t.reviewerId === this.promoterId);
				this.loading = false;
			},
			error: (err) => {
				console.error('Failed to load theses', err);
				this.loading = false;
			}
		});
	}

	getStudentName(thesis: Thesis): string {
		// Ideally we would fetch student name, but for now we check if ID is present
		return thesis.studentId ? 'Student przypisany' : 'Brak studenta';
	}

	onThesisSelect(): void {
		if (!this.selectedThesisId) return;
		
		this.loading = true;
		this.documentsService.list(this.selectedThesisId).subscribe({
			next: (docs) => {
				this.documents = docs;
				this.loading = false;
			},
			error: (err) => {
				console.error('Failed to load documents', err);
				this.documents = [];
				this.loading = false;
			}
		});
	}

	saveRemark(doc: DocumentElement): void {
		if (!this.selectedThesisId) return;
		
		this.saving = true;
		this.documentsService.update(this.selectedThesisId, doc.id, {
			comments: doc.comments
		}).subscribe({
			next: () => {
				// Show toast or success message? For now button state handles it
				this.saving = false;
			},
			error: (err) => {
				console.error('Failed to save remark', err);
				this.saving = false;
				alert('Wystąpił błąd podczas zapisywania uwagi.');
			}
		});
	}
}
