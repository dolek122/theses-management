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
import { DocumentsService } from '../../services/documents.service';
import { DocumentElement, DocumentElementType } from '../../models/document';
import { AuthService } from '../../services/auth.service';
import { ThesesService } from '../../services/theses.service';

@Component({
	selector: 'app-student-documents',
	standalone: true,
	imports: [CommonModule, FormsModule, MatTableModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatProgressSpinnerModule, MatIconModule],
	template: `
		<h3>Elementy pracy</h3>
		@if (loading) {
			<mat-spinner style="margin: 20px auto;"></mat-spinner>
		} @else if (!thesisId) {
			<div style="text-align: center; padding: 20px;">
				<p>Nie przypisano jeszcze tematu pracy dyplomowej.</p>
			</div>
		} @else {
			<form (ngSubmit)="addDoc()" style="display:grid; grid-template-columns: 180px 1fr 200px 160px; gap:12px; align-items:end; margin-bottom:16px;">
				<mat-form-field appearance="outline">
					<mat-label>Typ</mat-label>
					<mat-select [(ngModel)]="newDoc.type" name="type" required>
						<mat-option value="toc">Spis treści</mat-option>
						<mat-option value="chapter">Rozdział</mat-option>
						<mat-option value="bibliography">Bibliografia</mat-option>
					</mat-select>
				</mat-form-field>
				<mat-form-field appearance="outline">
					<mat-label>Tytuł</mat-label>
					<input matInput [(ngModel)]="newDoc.title" name="title" required minlength="3" maxlength="200" #titleInput="ngModel"/>
					<mat-error *ngIf="titleInput.invalid">Min. 3 znaki</mat-error>
				</mat-form-field>
				
				<!-- File Input -->
				<div style="margin-bottom: 16px;">
					<button type="button" mat-stroked-button (click)="fileInput.click()">
						<mat-icon>attach_file</mat-icon>
						{{ selectedFile ? selectedFile.name : 'Wybierz plik' }}
					</button>
					<input #fileInput type="file" (change)="onFileSelected($event)" style="display: none;">
				</div>

				<button mat-raised-button color="primary" type="submit" [disabled]="saving || titleInput.invalid">Dodaj</button>
			</form>

			<table mat-table [dataSource]="docs" class="mat-elevation-z1" style="width:100%;">
				<ng-container matColumnDef="type">
					<th mat-header-cell *matHeaderCellDef>Typ</th>
					<td mat-cell *matCellDef="let d">{{ labelType(d.type) }}</td>
				</ng-container>
				<ng-container matColumnDef="title">
					<th mat-header-cell *matHeaderCellDef>Tytuł</th>
					<td mat-cell *matCellDef="let d">
						{{ d.title }}
						<small *ngIf="d.fileName" style="display:block; color:gray;">{{ d.fileName }}</small>
					</td>
				</ng-container>
				<ng-container matColumnDef="status">
					<th mat-header-cell *matHeaderCellDef>Status</th>
					<td mat-cell *matCellDef="let d">
						{{ labelStatus(d.status) }}
						<div *ngIf="d.comments" style="font-size: 0.85em; color: #d32f2f; margin-top: 4px;">
							<strong>Uwagi:</strong> {{ d.comments }}
						</div>
					</td>
				</ng-container>
				<ng-container matColumnDef="actions">
					<th mat-header-cell *matHeaderCellDef>Akcje</th>
					<td mat-cell *matCellDef="let d">
						<button mat-button (click)="download(d)" *ngIf="d.fileName">Pobierz</button>
						<button mat-button (click)="submit(d)" [disabled]="d.status!=='draft' || saving">Wyślij</button>
						<button mat-button color="warn" (click)="remove(d.id)" [disabled]="saving">Usuń</button>
					</td>
				</ng-container>
				<tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
				<tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
			</table>
		}
	`
})
export class StudentDocumentsComponent implements OnInit {
	displayedColumns = ['type', 'title', 'status', 'actions'];
	docs: DocumentElement[] = [];
	loading = false;
	saving = false;
	thesisId: string | null = null;
	newDoc = { type: 'chapter' as DocumentElementType, title: '', content: '' };
	selectedFile: File | null = null;

	constructor(
		private readonly documentsService: DocumentsService,
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
				this.loadDocs();
			},
			error: () => {
				this.loading = false;
			}
		});
	}

	loadDocs(): void {
		if (!this.thesisId) return;
		this.loading = true;
		this.documentsService.list(this.thesisId).subscribe({
			next: (docs) => {
				this.docs = docs;
				this.loading = false;
			},
			error: (err) => {
				console.error('Failed to load documents', err);
				this.loading = false;
			}
		});
	}

	onFileSelected(event: any): void {
		this.selectedFile = event.target.files[0];
	}

	addDoc(): void {
		if (!this.thesisId || !this.newDoc.title) return;
		if (this.newDoc.title.length < 3) return; // Extra check
		
		this.saving = true;
		
		this.documentsService.create(this.thesisId, {
			thesisId: this.thesisId,
			type: this.newDoc.type,
			title: this.newDoc.title,
			content: this.newDoc.content || '',
			file: this.selectedFile || undefined
		}).subscribe({
			next: () => {
				this.newDoc = { type: 'chapter', title: '', content: '' };
				this.selectedFile = null;
				this.loadDocs();
				this.saving = false;
			},
			error: (err) => {
				console.error('Failed to create document', err);
				this.saving = false;
			}
		});
	}

	submit(doc: DocumentElement): void {
		if (!this.thesisId) return;
		this.saving = true;
		this.documentsService.update(this.thesisId, doc.id, { status: 'submitted' }).subscribe({
			next: () => {
				this.loadDocs();
				this.saving = false;
			},
			error: (err) => {
				console.error('Failed to submit document', err);
				this.saving = false;
			}
		});
	}

	download(doc: DocumentElement): void {
		if (!this.thesisId) return;
		this.documentsService.download(this.thesisId, doc.id).subscribe({
			next: (blob) => {
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = doc.fileName || 'dokument';
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				window.URL.revokeObjectURL(url);
			},
			error: (err) => console.error('Download failed', err)
		});
	}

	remove(id: string): void {
		if (!this.thesisId) return;
		if (!confirm('Czy na pewno usunąć element?')) return;
		this.saving = true;
		this.documentsService.remove(this.thesisId, id).subscribe({
			next: () => {
				this.loadDocs();
				this.saving = false;
			},
			error: (err) => {
				console.error('Failed to remove document', err);
				this.saving = false;
			}
		});
	}

	labelType(t: DocumentElementType): string {
		return t === 'toc' ? 'Spis treści' : t === 'chapter' ? 'Rozdział' : 'Bibliografia';
	}

	labelStatus(s: string): string {
		return s === 'draft' ? 'Szkic' : s === 'submitted' ? 'Wysłane' : 'Ocenione';
	}
}
