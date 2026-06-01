import { randomUUID, randomInt } from 'crypto';
import bcrypt from 'bcrypt';
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
import { signToken } from '../utils/jwt';
import { sendEmail } from '../utils/emailer';

const BCRYPT_ROUNDS = 12;

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

export class AccountAlreadyActiveError extends Error {
    constructor() {
        super('Account already verified');
        this.name = 'AccountAlreadyActiveError';
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
    // Cryptographically secure 6-digit string, zero-padded
    const n = randomInt(0, 1_000_000);
    return n.toString().padStart(6, '0');
}

function otpEmailBody(code: string): string {
    return `Hello,

Your verification code is: ${code}

This code expires in 10 minutes. If you didn't request this, you can ignore this email.

— Banks`;
}

// --- Public service functions ---

export async function registerUser(input: RegisterRequest): Promise<RegisterResponse> {
    const { email, password, phone } = input;

    if (!email || !password || !phone) {
        throw new InvalidInputError('email, password, and phone are required');
    }
    if (password.length < 8) {
        throw new InvalidInputError('password must be at least 8 characters');
    }

    const existing = await findByEmail(email);
    if (existing) {
        // An ACTIVE account is a genuine conflict — the email is taken.
        if (existing.status === 'active') {
            throw new EmailAlreadyExistsError(existing.email);
        }

        // INACTIVE: a prior signup that never verified. Self-heal instead of
        // blocking — refresh credentials, issue a fresh OTP, and let whoever
        // controls the inbox take ownership. Unsticks abandoned signups and
        // closes the squatting hole (the OTP only ever reaches the real owner).
        existing.passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
        existing.phone = phone;
        await save(existing);

        const refreshedOtp = generateOtp();
        await setOtp(existing.email, refreshedOtp);
        await sendEmail(existing.email, 'Your Banks verification code', otpEmailBody(refreshedOtp));

        if (process.env.NODE_ENV !== 'production') {
            console.log(`[OTP] Re-issued code for ${existing.email}: ${refreshedOtp}`);
        }

        return {
            message: 'Registration refreshed. A new OTP has been sent.',
            userId: existing.id,
        };
    }

    const newUser: StoredUser = {
        id: randomUUID(),
        email: email.toLowerCase(),
        passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
        phone,
        status: 'inactive',
        balance: '0.00',
        createdAt: new Date(),
    };

    await save(newUser);

    const otpCode = generateOtp();
    await setOtp(newUser.email, otpCode);

    // Send via email
    await sendEmail(newUser.email, 'Your Banks verification code', otpEmailBody(otpCode));

// Dev convenience: log to console so we don't have to check inbox during testing
    if (process.env.NODE_ENV !== 'production') {
        console.log(`[OTP] Generated code for ${newUser.email}: ${otpCode}`);
    }

    return {
        message: 'User registered. OTP sent.',
        userId: newUser.id,
    };
}

export async function loginUser(input: LoginRequest): Promise<AuthResponse> {
    const { email, password } = input;

    if (!email || !password) {
        throw new InvalidInputError('email and password are required');
    }

    const user = await findByEmail(email);
    if (!user) {
        throw new InvalidCredentialsError();
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
        throw new InvalidCredentialsError();
    }

    if (user.status !== 'active') {
        throw new AccountInactiveError();
    }

    return {
        token: signToken({ userId: user.id, email: user.email }),
        user: toProfile(user),
    };
}

export async function verifyOtp(input: VerifyOtpRequest): Promise<AuthResponse> {
    const { email, otp } = input;

    if (!email || !otp) {
        throw new InvalidInputError('email and otp are required');
    }

    const user = await findByEmail(email);
    if (!user) {
        throw new NoPendingRegistrationError();
    }

    const pending = await getOtp(email);
    if (!pending) {
        throw new NoPendingRegistrationError();
    }

    if (pending.expiresAt < new Date()) {
        await deleteOtp(email);
        throw new InvalidOtpError();
    }

    if (pending.code !== otp) {
        throw new InvalidOtpError();
    }

    // Activate the user and clean up
    user.status = 'active';
    user.balance = '1000.00'; // starting balance
    await save(user);
    await deleteOtp(email);

    return {
        token: signToken({ userId: user.id, email: user.email }),
        user: toProfile(user),
    };
}

export async function resendOtp(email: string): Promise<void> {
    if (!email) {
        throw new InvalidInputError('email is required');
    }

    const user = await findByEmail(email);
    if (!user) {
        throw new NoPendingRegistrationError();
    }

    if (user.status === 'active') {
        throw new AccountAlreadyActiveError();
    }

    // Generate fresh OTP, replacing any existing one
    const otpCode = generateOtp();
    await setOtp(user.email, otpCode);

    // in resendOtp (same):
    await sendEmail(user.email, 'Your Banks verification code', otpEmailBody(otpCode));

    if (process.env.NODE_ENV !== 'production') {
        console.log(`[OTP] Resent code for ${user.email}: ${otpCode}`);
    }
}