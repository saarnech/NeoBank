import type { Transaction, TransferRequest, PaginatedTransactions } from '../types/transaction';

export class NotImplementedError extends Error {
    constructor() {
        super('Not implemented yet');
        this.name = 'NotImplementedError';
    }
}

export function listTransactions(
    userId: string,
    page: number,
    limit: number,
): PaginatedTransactions {
    // Stub: return empty paginated result
    return {
        items: [],
        page,
        limit,
        totalItems: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
    };
}

export function createTransaction(
    senderId: string,
    input: TransferRequest,
): Transaction {
    // Stub: throw — real implementation needs DB and atomic balance updates
    throw new NotImplementedError();
}