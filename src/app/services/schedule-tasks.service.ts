import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { ScheduleTask } from '../models/schedule';

@Injectable({ providedIn: 'root' })
export class ScheduleTasksService {
	constructor(private readonly api: ApiService) {}

	list(thesisId: string): Observable<ScheduleTask[]> {
		return this.api.get<ScheduleTask[]>(`/theses/${thesisId}/schedule-tasks`);
	}
	create(thesisId: string, payload: Omit<ScheduleTask, 'id' | 'status' | 'grade' | 'comments'>): Observable<ScheduleTask> {
		return this.api.post<ScheduleTask>(`/theses/${thesisId}/schedule-tasks`, payload);
	}
	update(thesisId: string, taskId: string, patch: Partial<ScheduleTask>): Observable<ScheduleTask> {
		return this.api.patch<ScheduleTask>(`/theses/${thesisId}/schedule-tasks/${taskId}`, patch);
	}
	remove(thesisId: string, taskId: string): Observable<void> {
		return this.api.delete<void>(`/theses/${thesisId}/schedule-tasks/${taskId}`);
	}

	export(thesisId: string): Observable<Blob> {
		return this.api.getBlob(`/theses/${thesisId}/schedule-tasks/export`);
	}
}


