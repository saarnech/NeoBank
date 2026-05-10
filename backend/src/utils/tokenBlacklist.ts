type BlacklistedToken = {
    token: string;
    expiresAt: number; // Unix timestamp in seconds, from JWT's exp claim
};

const blacklist = new Set<string>();

// Optional: track expirations so we can clean stale entries
const expirations = new Map<string, number>();

export function blacklistToken(token: string, expiresAt: number): void {
    blacklist.add(token);
    expirations.set(token, expiresAt);
}

export function isBlacklisted(token: string): boolean {
    // Lazy cleanup: remove entries past their original expiry
    const exp = expirations.get(token);
    if (exp !== undefined && exp * 1000 < Date.now()) {
        blacklist.delete(token);
        expirations.delete(token);
        return false;
    }
    return blacklist.has(token);
}

export function clearAll(): void {
    blacklist.clear();
    expirations.clear();
}