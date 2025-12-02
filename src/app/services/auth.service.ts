import { Injectable, signal } from '@angular/core';
import { UserRole, User } from '../models/user';
import { ApiService } from './api.service';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

const STORAGE_KEY = 'app.role';
const USER_KEY = 'app.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
	private readonly _role = signal<UserRole | null>(this.readRole());
	private readonly _user = signal<User | null>(this.readUser());

	constructor(private api: ApiService) {}

	role() {
		return this._role();
	}

	user() {
		return this._user();
	}

	login(email: string, password: string): Observable<User> {
		return this.api.post<User>('/auth/login', { email, password }).pipe(
			tap(user => {
				this.setRole(user.role);
				this.setUser(user);
			})
		);
	}

	register(data: Partial<User> & { password: string }): Observable<User> {
		return this.api.post<User>('/auth/register', data);
	}

	setRole(role: UserRole): void {
		this._role.set(role);
		localStorage.setItem(STORAGE_KEY, role);
	}

	private setUser(user: User): void {
		this._user.set(user);
		localStorage.setItem(USER_KEY, JSON.stringify(user));
	}

	clear(): void {
		this._role.set(null);
		this._user.set(null);
		localStorage.removeItem(STORAGE_KEY);
		localStorage.removeItem(USER_KEY);
	}

	private readRole(): UserRole | null {
		const v = localStorage.getItem(STORAGE_KEY);
		// strict check or loose check? Let's assume any string might be a role for now, or restrict
		return v as UserRole | null;
	}

	private readUser(): User | null {
		const v = localStorage.getItem(USER_KEY);
		try {
			return v ? JSON.parse(v) : null;
		} catch {
			return null;
		}
	}
}
