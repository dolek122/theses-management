import { Injectable, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ThesisUpdateEvent } from './websocket.service';

export interface AppNotification {
	id: string;
	message: string;
	date: Date;
	read: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
	notifications = signal<AppNotification[]>([]);

	constructor(private snackBar: MatSnackBar) {}

	show(message: string, action = 'Zamknij'): void {
		this.snackBar.open(message, action, {
			duration: 5000,
			horizontalPosition: 'end',
			verticalPosition: 'top'
		});
	}

	handleEvent(event: ThesisUpdateEvent): void {
		let message = '';
		const entity = event.updateType === 'schedule_task' ? 'Zadanie' : event.updateType === 'document' ? 'Dokument' : 'Praca';
		const action = event.action === 'created' ? 'utworzone' : event.action === 'updated' ? 'zaktualizowane' : 'usunięte';

		message = `${entity} zostało ${action}`;
		
		// Customize messages based on action/type if needed
		if (event.updateType === 'schedule_task' && event.action === 'updated') {
			message = 'Status zadania lub ocena została zaktualizowana';
		} else if (event.updateType === 'document' && event.action === 'updated') {
			message = 'Status dokumentu lub ocena została zaktualizowana';
		}

		this.addNotification(message);
		this.show(message);
	}

	addNotification(message: string): void {
		const newNotification: AppNotification = {
			id: Math.random().toString(36).substring(7),
			message,
			date: new Date(),
			read: false
		};
		this.notifications.update(current => [newNotification, ...current]);
	}

	markAsRead(id: string): void {
		this.notifications.update(current =>
			current.map(n => n.id === id ? { ...n, read: true } : n)
		);
	}

	markAllAsRead(): void {
		this.notifications.update(current =>
			current.map(n => ({ ...n, read: true }))
		);
	}

	clear(): void {
		this.notifications.set([]);
	}
}
