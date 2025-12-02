export type ScheduleTaskStatus = 'pending' | 'in_review' | 'completed';

export interface ScheduleTask {
	id: string;
	thesisId: string;
	name: string;
	scope: string;
	dueDate: string;
	status: ScheduleTaskStatus;
	grade?: number;
	comments?: string;
}


