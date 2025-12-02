import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { Thesis } from '../models/thesis';

@Injectable({ providedIn: 'root' })
export class ThesesService {
	constructor(private readonly api: ApiService) {}

	list(): Observable<Thesis[]> {
		return this.api.get<Thesis[]>('/theses');
	}
	create(payload: Pick<Thesis, 'title' | 'description' | 'promoterId'>): Observable<Thesis> {
		return this.api.post<Thesis>('/theses', payload);
	}
	update(id: string, payload: Partial<Thesis>): Observable<Thesis> {
		return this.api.patch<Thesis>(`/theses/${id}`, payload);
	}
	remove(id: string): Observable<void> {
		return this.api.delete<void>(`/theses/${id}`);
	}
	assignStudent(id: string, studentId: string | null): Observable<Thesis> {
		return this.api.patch<Thesis>(`/theses/${id}/student`, { studentId });
	}
	assignReviewer(id: string, reviewerId: string | null): Observable<Thesis> {
		return this.api.patch<Thesis>(`/theses/${id}/reviewer`, { reviewerId });
	}
	getByStudentId(studentId: string): Observable<Thesis> {
		return this.api.get<Thesis>(`/theses/student/${studentId}`);
	}
}
