import type { Request, Response } from 'express';
import {
    registerUser,
    loginUser,
    EmailAlreadyExistsError,
    InvalidInputError,
    InvalidCredentialsError,
    AccountInactiveError,
} from '../services/auth.service';
import type { RegisterRequest, LoginRequest } from '../types/auth';

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

export function login(req: Request, res: Response): void {
    try {
        const input = req.body as LoginRequest;
        const result = loginUser(input);
        res.status(200).json(result);
    } catch (err) {
        if (err instanceof InvalidInputError) {
            res.status(400).json({ error: err.message });
            return;
        }
        if (err instanceof InvalidCredentialsError) {
            res.status(401).json({ error: err.message });
            return;
        }
        if (err instanceof AccountInactiveError) {
            res.status(403).json({ error: err.message });
            return;
        }
        console.error('Unexpected error in login:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}