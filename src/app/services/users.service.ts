import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { User, UserRole } from '../models/user';
import { HttpParams } from '@angular/common/http';

export interface UserCreateRequest {
	name: string;
	email: string;
	role: UserRole;
	password?: string;
}

export interface UserUpdateRequest {
	name?: string;
	email?: string;
	role?: UserRole;
	password?: string;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
	constructor(private readonly api: ApiService) {}

	list(role?: UserRole): Observable<User[]> {
		let params = new HttpParams();
		if (role) {
			params = params.set('role', role);
		}
		return this.api.get<User[]>('/users', params);
	}

	getById(id: string): Observable<User> {
		return this.api.get<User>(`/users/${id}`);
	}

	create(user: UserCreateRequest): Observable<User> {
		return this.api.post<User>('/users', user);
	}

	update(id: string, user: UserUpdateRequest): Observable<User> {
		return this.api.patch<User>(`/users/${id}`, user);
	}

	delete(id: string): Observable<void> {
		return this.api.delete<void>(`/users/${id}`);
	}
}
