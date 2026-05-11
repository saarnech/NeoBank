import type { StoredUser } from '../types/auth';
import { prisma } from './prismaClient';

// Map Prisma's database row to our internal StoredUser type
function toStoredUser(dbRow: {
    id: string;
    email: string;
    passwordHash: string;
    phone: string;
    status: 'INACTIVE' | 'ACTIVE';
    balance: { toString(): string };
    createdAt: Date;
}): StoredUser {
    return {
        id: dbRow.id,
        email: dbRow.email,
        passwordHash: dbRow.passwordHash,
        phone: dbRow.phone,
        status: dbRow.status === 'ACTIVE' ? 'active' : 'inactive',
        balance: dbRow.balance.toString(),
        createdAt: dbRow.createdAt,
    };
}

export async function findByEmail(email: string): Promise<StoredUser | undefined> {
    const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
    });
    return user ? toStoredUser(user) : undefined;
}

export async function findById(id: string): Promise<StoredUser | undefined> {
    const user = await prisma.user.findUnique({
        where: { id },
    });
    return user ? toStoredUser(user) : undefined;
}

export async function save(user: StoredUser): Promise<void> {
    await prisma.user.upsert({
        where: { id: user.id },
        update: {
            email: user.email.toLowerCase(),
            passwordHash: user.passwordHash,
            phone: user.phone,
            status: user.status === 'active' ? 'ACTIVE' : 'INACTIVE',
            balance: user.balance,
        },
        create: {
            id: user.id,
            email: user.email.toLowerCase(),
            passwordHash: user.passwordHash,
            phone: user.phone,
            status: user.status === 'active' ? 'ACTIVE' : 'INACTIVE',
            balance: user.balance,
        },
    });
}

export async function clear(): Promise<void> {
    await prisma.user.deleteMany({});
}