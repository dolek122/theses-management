export interface ChatMessage {
    content: string;
    sender: string;
    thesisId: string;
    type: 'CHAT' | 'JOIN' | 'LEAVE';
    timestamp?: string;
}

