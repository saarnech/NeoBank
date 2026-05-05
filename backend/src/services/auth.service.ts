import { randomUUID } from 'crypto';
import type { RegisterRequest, RegisterResponse, StoredUser } from '../types/auth';
import { findByEmail, save } from '../utils/userStore';

export class EmailAlreadyExistsError extends Error {
    constructor(email: string) {
        super(`Email already registered: ${email}`);
        this.name = 'EmailAlreadyExistsError';
    }
}

export class InvalidInputError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'InvalidInputError';
    }
}

export function registerUser(input: RegisterRequest): RegisterResponse {
    const { email, password, phone } = input;

    if (!email || !password || !phone) {
        throw new InvalidInputError('email, password, and phone are required');
    }
    if (password.length < 8) {
        throw new InvalidInputError('password must be at least 8 characters');
    }

    const existing = findByEmail(email);
    if (existing) {
        throw new EmailAlreadyExistsError(existing.email);
    }

    const newUser: StoredUser = {
        id: randomUUID(),
        email: email.toLowerCase(),
        passwordHash: password, // TODO: hash with bcrypt in Phase 2
        phone,
        status: 'inactive',
        balance: '0.00',
        createdAt: new Date(),
    };

    save(newUser);

    return {
        message: 'User registered. OTP sent.',
        userId: newUser.id,
    };
}