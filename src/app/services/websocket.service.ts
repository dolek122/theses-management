import { Injectable } from '@angular/core';
import { Client, Message } from '@stomp/stompjs';
import { BehaviorSubject, Observable } from 'rxjs';
import SockJS from 'sockjs-client';

export interface ThesisUpdateEvent {
	thesisId: string;
	updateType: string;
	entityId: string;
	action: string;
	timestamp: string;  
}

@Injectable({ providedIn: 'root' })
export class WebSocketService {
	private client: Client;
	public state = new BehaviorSubject<string>('disconnected');
	
	constructor() {
		this.client = new Client({
			webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
			debug: (str: string) => console.log('[STOMP]: ' + str),
			reconnectDelay: 5000,
			heartbeatIncoming: 4000,
			heartbeatOutgoing: 4000,
		});

		this.client.onConnect = (frame) => {
			this.state.next('connected');
			console.log('Connected to WebSocket', frame);
		};

		this.client.onDisconnect = (frame) => {
			this.state.next('disconnected');
			console.log('Disconnected from WebSocket', frame);
		};

		this.client.onStompError = (frame: any) => {
			console.error('Broker reported error: ' + frame.headers['message']);
			console.error('Additional details: ' + frame.body);
		};
        
        this.client.onWebSocketClose = () => {
            this.state.next('disconnected');
            console.log('WebSocket closed');
        }
	}

	connect(): void {
        console.log('WebSocketService: connecting...');
		if (!this.client.active) {
			this.client.activate();
		}
	}

	disconnect(): void {
        console.log('WebSocketService: disconnecting...');
		if (this.client.active) {
            this.client.deactivate();
        }
	}

	subscribe<T>(topic: string): Observable<T> {
		return new Observable(observer => {
	  
		  const subscribeWhenReady = (): () => void => {
			if (this.state.value === 'connected') {
			  console.log(`Subscribing to ${topic}`);
	  
			  const sub = this.client.subscribe(topic, (message: Message) => {
				console.log(`Received message on ${topic}:`, message.body);
				try {
				  observer.next(JSON.parse(message.body) as T);
				} catch (e) {
				  console.error('Failed to parse message', e);
				}
			  });
	  
			  return () => {
				console.log(`Unsubscribing from ${topic}`);
				sub.unsubscribe();
			  };
			}
	  
			return setTimeout(() => subscribeWhenReady(), 100) as unknown as () => void;
		  };
	  
		  return subscribeWhenReady();
		});
	  }
	  

	publish(destination: string, body: any): void {
		if (this.client && this.client.active && this.state.value === 'connected') {
            console.log(`Publishing to ${destination}:`, body);
			this.client.publish({
				destination,
				body: JSON.stringify(body)
			});
		} else {
			console.warn('Cannot publish, client not connected');
            // Optional: queue message or notify user
		}
	}
}
