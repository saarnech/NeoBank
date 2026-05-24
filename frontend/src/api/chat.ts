import apiClient from './client';

export type ChatMessage = {
    role: 'user' | 'assistant';
    content: string;
};

type ChatResponse = {
    reply: string;
};

export async function sendChatMessage(messages: ChatMessage[]): Promise<string> {
    const response = await apiClient.post<ChatResponse>('/chat', { messages });
    return response.data.reply;
}