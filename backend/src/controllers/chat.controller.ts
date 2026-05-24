import type { Request, Response, NextFunction } from 'express';
import { chat } from '../services/chat.service';

type IncomingMessage = {
    role: 'user' | 'assistant';
    content: string;
};

function isValidMessage(m: unknown): m is IncomingMessage {
    if (typeof m !== 'object' || m === null) return false;
    const msg = m as Record<string, unknown>;
    if (msg.role !== 'user' && msg.role !== 'assistant') return false;
    if (typeof msg.content !== 'string') return false;
    if (msg.content.length < 1 || msg.content.length > 2000) return false;
    return true;
}

export async function postChat(req: Request, res: Response, next: NextFunction) {
    try {
        const { messages } = req.body;

        if (!Array.isArray(messages)) {
            res.status(400).json({ error: 'messages must be an array' });
            return;
        }

        if (messages.length < 1 || messages.length > 20) {
            res.status(400).json({ error: 'messages must contain between 1 and 20 items' });
            return;
        }

        if (!messages.every(isValidMessage)) {
            res.status(400).json({ error: 'each message must have role (user|assistant) and content (1-2000 chars)' });
            return;
        }

        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const reply = await chat(messages, req.user.userId);
        res.json({ reply });
    } catch (err) {
        next(err);
    }
}