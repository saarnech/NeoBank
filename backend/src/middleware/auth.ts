import type {NextFunction, Request, Response} from 'express';
import {verifyToken} from '../utils/jwt';
import { isBlacklisted } from '../utils/tokenBlacklist';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing or invalid Authorization header' });
        return;
    }

    const token = authHeader.slice('Bearer '.length);

    if (isBlacklisted(token)) {
        res.status(401).json({ error: 'Token has been revoked' });
        return;
    }

    try {
        req.user = verifyToken(token);
        next();
    } catch {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
}