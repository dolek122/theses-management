export interface Thesis {
	id: string;
	title: string;
	description: string;
	promoterId: string;
	studentId?: string;
	reviewerId?: string;
	createdAt: string;
	updatedAt: string;
}
