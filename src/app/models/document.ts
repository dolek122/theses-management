export type DocumentElementType = 'toc' | 'chapter' | 'bibliography';
export type DocumentStatus = 'draft' | 'submitted' | 'reviewed';

export interface DocumentElement {
	id: string;
	thesisId: string;
	type: DocumentElementType;
	title: string;
	content: string;
	order?: number;
	status: DocumentStatus;
	comments?: string;
	grade?: number;
	updatedAt: string;
	fileName?: string;
	fileType?: string;
	fileData?: string; // base64 or blob url if needed, but typically just metadata is enough for list
}
