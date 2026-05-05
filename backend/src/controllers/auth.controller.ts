import type { Request, Response } from 'express';
import { registerUser, EmailAlreadyExistsError, InvalidInputError } from '../services/auth.service';
import type { RegisterRequest } from '../types/auth';

export function register(req: Request, res: Response): void {
    try {
        const input = req.body as RegisterRequest;
        const result = registerUser(input);
        res.status(201).json(result);
    } catch (err) {
        if (err instanceof InvalidInputError) {
            res.status(400).json({ error: err.message });
            return;
        }
        if (err instanceof EmailAlreadyExistsError) {
            res.status(409).json({ error: err.message });
            return;
        }
        console.error('Unexpected error in register:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}