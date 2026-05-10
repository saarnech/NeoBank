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

export function findById(id: string): StoredUser | undefined {
    for (const user of users.values()) {
        if (user.id === id) return user;
    }
    return undefined;
}