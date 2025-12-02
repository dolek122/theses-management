import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ThesisUpdateEvent {
	thesisId: string;
	updateType: 'schedule_task' | 'document' | 'thesis';
	entityId: string;
	action: 'created' | 'updated' | 'deleted';
	timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class ThesisEventsService {
	private eventSources: Map<string, EventSource> = new Map();
	private eventSubjects: Map<string, Subject<ThesisUpdateEvent>> = new Map();

	subscribe(thesisId: string): Observable<ThesisUpdateEvent> {
		// If already subscribed, return existing subject
		if (this.eventSubjects.has(thesisId)) {
			return this.eventSubjects.get(thesisId)!;
		}

		const subject = new Subject<ThesisUpdateEvent>();
		this.eventSubjects.set(thesisId, subject);

		const eventSource = new EventSource(`${environment.apiBaseUrl}/theses/${thesisId}/events`);
		this.eventSources.set(thesisId, eventSource);

		eventSource.addEventListener('connected', (event: any) => {
			console.log('Connected to thesis events stream', event);
		});

		eventSource.addEventListener('update', (event: MessageEvent) => {
			try {
				const data = JSON.parse(event.data);
				subject.next(data as ThesisUpdateEvent);
			} catch (error) {
				console.error('Error parsing event data', error);
			}
		});

		eventSource.onerror = (error) => {
			console.error('EventSource error', error);
			subject.error(error);
			this.unsubscribe(thesisId);
		};

		return subject.asObservable();
	}

	unsubscribe(thesisId: string): void {
		const eventSource = this.eventSources.get(thesisId);
		if (eventSource) {
			eventSource.close();
			this.eventSources.delete(thesisId);
		}

		const subject = this.eventSubjects.get(thesisId);
		if (subject) {
			subject.complete();
			this.eventSubjects.delete(thesisId);
		}
	}

	ngOnDestroy(): void {
		// Clean up all subscriptions
		this.eventSources.forEach((eventSource, thesisId) => {
			this.unsubscribe(thesisId);
		});
	}
}

