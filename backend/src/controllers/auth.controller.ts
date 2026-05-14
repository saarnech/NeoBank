import type { Request, Response } from 'express';
import {
    registerUser,
    loginUser,
    verifyOtp,
    resendOtp,
    EmailAlreadyExistsError,
    InvalidInputError,
    InvalidCredentialsError,
    AccountInactiveError,
    InvalidOtpError,
    NoPendingRegistrationError,
    AccountAlreadyActiveError,
} from '../services/auth.service';
import type { RegisterRequest, LoginRequest, VerifyOtpRequest } from '../types/auth';
import { blacklistToken } from '../utils/tokenBlacklist';

export async function register(req: Request, res: Response): Promise<void> {
    try {
        const input = req.body as RegisterRequest;
        const result = await registerUser(input);
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

export async function login(req: Request, res: Response): Promise<void> {
    try {
        const input = req.body as LoginRequest;
        const result = await loginUser(input);
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

export async function verifyOtpController(req: Request, res: Response): Promise<void> {
    try {
        const input = req.body as VerifyOtpRequest;
        const result = await verifyOtp(input);
        res.status(200).json(result);
    } catch (err) {
        if (err instanceof InvalidInputError) {
            res.status(400).json({ error: err.message });
            return;
        }
        if (err instanceof InvalidOtpError) {
            res.status(401).json({ error: err.message });
            return;
        }
        if (err instanceof NoPendingRegistrationError) {
            res.status(404).json({ error: err.message });
            return;
        }
        console.error('Unexpected error in verifyOtp:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export function logout(req: Request, res: Response): void {
    if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const authHeader = req.headers.authorization!;
    const token = authHeader.slice('Bearer '.length);

    // exp was verified to be valid (token isn't expired), so it must exist
    const exp = req.user.exp ?? 0;

    blacklistToken(token, exp);

    res.status(204).send();
}

export async function resendOtpController(req: Request, res: Response): Promise<void> {
    try {
        const { email } = req.body as { email: string };
        await resendOtp(email);
        res.status(200).json({ message: 'Verification code sent' });
    } catch (err) {
        if (err instanceof InvalidInputError) {
            res.status(400).json({ error: err.message });
            return;
        }
        if (err instanceof NoPendingRegistrationError) {
            res.status(404).json({ error: err.message });
            return;
        }
        if (err instanceof AccountAlreadyActiveError) {
            res.status(409).json({ error: err.message });
            return;
        }
        console.error('Unexpected error in resendOtp:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}