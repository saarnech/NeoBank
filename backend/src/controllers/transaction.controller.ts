import type { Request, Response } from 'express';
import { listTransactions, createTransaction, NotImplementedError } from '../services/transaction.service';
import type { TransferRequest } from '../types/transaction';

export function getTransactions(req: Request, res: Response): void {
    if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    // Parse pagination from query string
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;

    if (page < 1 || limit < 1 || limit > 100) {
        res.status(400).json({ error: 'Invalid pagination parameters' });
        return;
    }

    const result = listTransactions(req.user.userId, page, limit);
    res.status(200).json(result);
}

export function postTransaction(req: Request, res: Response): void {
    if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    try {
        const input = req.body as TransferRequest;
        const result = createTransaction(req.user.userId, input);
        res.status(201).json(result);
    } catch (err) {
        if (err instanceof NotImplementedError) {
            res.status(501).json({ error: 'Money transfers will be enabled in Phase 3' });
            return;
        }
        console.error('Unexpected error in postTransaction:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}