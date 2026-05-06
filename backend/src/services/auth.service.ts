import { randomUUID } from 'crypto';
import type {
    RegisterRequest,
    RegisterResponse,
    LoginRequest,
    AuthResponse,
    UserProfile,
    StoredUser,
    VerifyOtpRequest,
} from '../types/auth';
import { findByEmail, save } from '../utils/userStore';
import { setOtp, getOtp, deleteOtp } from '../utils/otpStore';

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

export class InvalidOtpError extends Error {
    constructor() {
        super('Incorrect or expired OTP');
        this.name = 'InvalidOtpError';
    }
}

export class NoPendingRegistrationError extends Error {
    constructor() {
        super('No pending registration found for this email');
        this.name = 'NoPendingRegistrationError';
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

function generateOtp(): string {
    // Random 6-digit string, zero-padded
    const n = Math.floor(Math.random() * 1_000_000);
    return n.toString().padStart(6, '0');
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

    const otpCode = generateOtp();
    setOtp(newUser.email, otpCode);
    console.log(`[OTP] Generated code for ${newUser.email}: ${otpCode}`);

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

export function verifyOtp(input: VerifyOtpRequest): AuthResponse {
    const { email, otp } = input;

    if (!email || !otp) {
        throw new InvalidInputError('email and otp are required');
    }

    const user = findByEmail(email);
    if (!user) {
        throw new NoPendingRegistrationError();
    }

    const pending = getOtp(email);
    if (!pending) {
        throw new NoPendingRegistrationError();
    }

    if (pending.expiresAt < new Date()) {
        deleteOtp(email);
        throw new InvalidOtpError();
    }

    if (pending.code !== otp) {
        throw new InvalidOtpError();
    }

    // Activate the user and clean up
    user.status = 'active';
    user.balance = '1000.00'; // starting balance
    save(user);
    deleteOtp(email);

    return {
        token: 'FAKE_JWT_FOR_PHASE_1',
        user: toProfile(user),
    };
}