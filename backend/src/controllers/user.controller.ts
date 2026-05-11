import type { Request, Response } from 'express';
import { findUserById } from '../services/user.service';

export async function getMe(req: Request, res: Response): Promise<void> {
    // requireAuth middleware guarantees req.user is set
    if (!req.user) {
        // Defensive — should never happen if middleware ran
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const user = await findUserById(req.user.userId);
    if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
    }

    res.status(200).json({
        id: user.id,
        email: user.email,
        balance: user.balance,
    });
}