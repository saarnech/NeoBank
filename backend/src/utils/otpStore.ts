import { prisma } from './prismaClient';

const DEFAULT_TTL_MINUTES = Number(process.env.OTP_TTL_MINUTES) || 10;

type PendingOtp = {
    code: string;
    expiresAt: Date;
};

export async function setOtp(
    email: string,
    code: string,
    ttlMinutes: number = DEFAULT_TTL_MINUTES,
): Promise<void> {
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
    await prisma.pendingOtp.upsert({
        where: { email: email.toLowerCase() },
        update: { code, expiresAt },
        create: { email: email.toLowerCase(), code, expiresAt },
    });
}

export async function getOtp(email: string): Promise<PendingOtp | undefined> {
    const row = await prisma.pendingOtp.findUnique({
        where: { email: email.toLowerCase() },
    });
    if (!row) return undefined;
    return { code: row.code, expiresAt: row.expiresAt };
}

export async function deleteOtp(email: string): Promise<void> {
    // deleteMany doesn't throw if the row doesn't exist (unlike delete)
    await prisma.pendingOtp.deleteMany({
        where: { email: email.toLowerCase() },
    });
}

export async function clearAll(): Promise<void> {
    await prisma.pendingOtp.deleteMany({});
}