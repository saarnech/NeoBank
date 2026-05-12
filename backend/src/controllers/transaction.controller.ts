import type { Request, Response } from 'express';
import {
    listTransactions,
    createTransaction,
    InvalidTransferError,
    RecipientNotFoundError,
    InsufficientBalanceError,
    SelfTransferError,
} from '../services/transaction.service';
import type { TransferRequest } from '../types/transaction';

export async function getTransactions(req: Request, res: Response): Promise<void> {
    if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;

    if (page < 1 || limit < 1 || limit > 100) {
        res.status(400).json({ error: 'Invalid pagination parameters' });
        return;
    }

    const result = await listTransactions(req.user.userId, page, limit);
    res.status(200).json(result);
}

export async function postTransaction(req: Request, res: Response): Promise<void> {
    if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    try {
        const input = req.body as TransferRequest;
        const result = await createTransaction(req.user.userId, input);
        res.status(201).json(result);
    } catch (err) {
        if (err instanceof InvalidTransferError) {
            res.status(400).json({ error: err.message });
            return;
        }
        if (err instanceof RecipientNotFoundError) {
            res.status(404).json({ error: err.message });
            return;
        }
        if (err instanceof InsufficientBalanceError || err instanceof SelfTransferError) {
            res.status(422).json({ error: err.message });
            return;
        }
        console.error('Unexpected error in postTransaction:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}