import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
	private readonly base = environment.apiBaseUrl;

	constructor(private readonly http: HttpClient) {}

	get<T>(path: string, params?: HttpParams) {
		return this.http.get<T>(`${this.base}${path}`, { params });
	}
	getBlob(path: string) {
		return this.http.get(`${this.base}${path}`, { responseType: 'blob' });
	}
	post<T>(path: string, body: unknown, headers?: HttpHeaders) {
		return this.http.post<T>(`${this.base}${path}`, body, { headers });
	}
	put<T>(path: string, body: unknown) {
		return this.http.put<T>(`${this.base}${path}`, body);
	}
	patch<T>(path: string, body: unknown) {
		return this.http.patch<T>(`${this.base}${path}`, body);
	}
	delete<T>(path: string) {
		return this.http.delete<T>(`${this.base}${path}`);
	}
}


