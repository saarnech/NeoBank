import { randomUUID } from 'crypto';
import type {
    RegisterRequest,
    RegisterResponse,
    LoginRequest,
    AuthResponse,
    UserProfile,
    StoredUser,
} from '../types/auth';
import { findByEmail, save } from '../utils/userStore';

// --- Custom error classes ---

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

export class InvalidCredentialsError extends Error {
    constructor() {
        super('Invalid email or password');
        this.name = 'InvalidCredentialsError';
    }
}

export class AccountInactiveError extends Error {
    constructor() {
        super('Account not yet activated. Please complete OTP verification.');
        this.name = 'AccountInactiveError';
    }
}

// --- Helpers ---

function toProfile(user: StoredUser): UserProfile {
    return {
        id: user.id,
        email: user.email,
        balance: user.balance,
    };
}

// --- Public service functions ---

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

export function loginUser(input: LoginRequest): AuthResponse {
    const { email, password } = input;

    if (!email || !password) {
        throw new InvalidInputError('email and password are required');
    }

    const user = findByEmail(email);
    if (!user) {
        throw new InvalidCredentialsError();
    }

    if (user.passwordHash !== password) {
        // TODO: bcrypt.compare in Phase 2
        throw new InvalidCredentialsError();
    }

    if (user.status !== 'active') {
        throw new AccountInactiveError();
    }

    return {
        token: 'FAKE_JWT_FOR_PHASE_1',
        user: toProfile(user),
    };
}