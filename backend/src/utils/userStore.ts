import type { StoredUser } from '../types/auth';

const users = new Map<string, StoredUser>();

export function findByEmail(email: string): StoredUser | undefined {
    return users.get(email.toLowerCase());
}

export function save(user: StoredUser): void {
    users.set(user.email.toLowerCase(), user);
}

export function clear(): void {
    users.clear();
}