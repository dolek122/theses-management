export type UserRole = 'student' | 'promoter' | 'reviewer' | 'admin';

export interface User {
	id: string;
	name: string;
	email: string;
	role: UserRole;
}


