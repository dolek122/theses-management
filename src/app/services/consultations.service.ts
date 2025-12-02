import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { ConsultationSlot, ConsultationSlotCreateRequest } from '../models/consultation';

@Injectable({ providedIn: 'root' })
export class ConsultationsService {
	constructor(private readonly api: ApiService) {}

	listForPromoter(promoterId: string): Observable<ConsultationSlot[]> {
		return this.api.get<ConsultationSlot[]>(`/promoters/${promoterId}/consultations`);
	}
	createSlot(promoterId: string, payload: ConsultationSlotCreateRequest): Observable<ConsultationSlot> {
		return this.api.post<ConsultationSlot>(`/promoters/${promoterId}/consultations`, payload);
	}
	removeSlot(promoterId: string, slotId: string): Observable<void> {
		return this.api.delete<void>(`/promoters/${promoterId}/consultations/${slotId}`);
	}
	book(slotId: string, studentId: string): Observable<void> {
		return this.api.post<void>(`/consultations/${slotId}/book`, { studentId });
	}
	cancel(slotId: string, studentId: string): Observable<void> {
		return this.api.post<void>(`/consultations/${slotId}/cancel`, { studentId });
	}
}
