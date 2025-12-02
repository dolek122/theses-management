import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { DocumentElement } from '../models/document';

@Injectable({ providedIn: 'root' })
export class DocumentsService {
	constructor(private readonly api: ApiService) {}

	list(thesisId: string): Observable<DocumentElement[]> {
		return this.api.get<DocumentElement[]>(`/theses/${thesisId}/documents`);
	}
	create(thesisId: string, payload: Omit<DocumentElement, 'id' | 'status' | 'updatedAt' | 'grade' | 'comments'> & { file?: File, ordinalValue?: number }): Observable<DocumentElement> {
		const formData = new FormData();
		const data = {
			type: payload.type,
			title: payload.title,
			content: payload.content || '',
			order: payload.ordinalValue
		};
		formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));
		if (payload.file) {
			formData.append('file', payload.file);
		}
		return this.api.post<DocumentElement>(`/theses/${thesisId}/documents`, formData);
	}
	update(thesisId: string, docId: string, patch: Partial<DocumentElement>): Observable<DocumentElement> {
		return this.api.patch<DocumentElement>(`/theses/${thesisId}/documents/${docId}`, patch);
	}
	remove(thesisId: string, docId: string): Observable<void> {
		return this.api.delete<void>(`/theses/${thesisId}/documents/${docId}`);
	}
	download(thesisId: string, docId: string): Observable<Blob> {
		return this.api.getBlob(`/theses/${thesisId}/documents/${docId}/download`);
	}
}
