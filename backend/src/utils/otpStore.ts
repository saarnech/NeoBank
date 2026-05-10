type PendingOtp = {
    code: string;
    expiresAt: Date;
};

const otps = new Map<string, PendingOtp>();

const DEFAULT_TTL_MINUTES = Number(process.env.OTP_TTL_MINUTES) || 10;

export function setOtp(email: string, code: string, ttlMinutes: number = DEFAULT_TTL_MINUTES): void {
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
    otps.set(email.toLowerCase(), { code, expiresAt });
}

export function getOtp(email: string): PendingOtp | undefined {
    return otps.get(email.toLowerCase());
}

export function deleteOtp(email: string): void {
    otps.delete(email.toLowerCase());
}

export function clearAll(): void {
    otps.clear();
}