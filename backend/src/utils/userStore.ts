import type { StoredUser } from '../types/auth';

const users = new Map<string, StoredUser>();

users.set('seeded@example.com', {
    id: 'seeded-uuid',
    email: 'seeded@example.com',
    passwordHash: 'TestPass123',
    phone: '+1234567890',
    status: 'active',
    balance: '1000.00',
    createdAt: new Date(),
});

export function findByEmail(email: string): StoredUser | undefined {
    return users.get(email.toLowerCase());
}

export function save(user: StoredUser): void {
    users.set(user.email.toLowerCase(), user);
}

export function clear(): void {
    users.clear();
}