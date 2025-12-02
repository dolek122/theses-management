export interface ConsultationSlot {
	id: string;
	promoterId: string;
	startTime: string;
	endTime: string;
	capacity: number;
	registeredStudentIds: string[];
	notes?: string;
}

export interface ConsultationSlotCreateRequest {
	promoterId: string;
	startTime: string; // Renamed from start
	endTime: string;   // Renamed from end
	capacity: number;
	notes?: string;
}
