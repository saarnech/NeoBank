import type { StoredUser } from '../types/auth';
import { findById } from '../utils/userStore';

export function findUserById(id: string): StoredUser | undefined {
    return findById(id);
}