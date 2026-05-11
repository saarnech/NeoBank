import type { StoredUser } from '../types/auth';
import { findById } from '../utils/userStore';

export async function findUserById(id: string): Promise<StoredUser | undefined> {
    return findById(id);
}