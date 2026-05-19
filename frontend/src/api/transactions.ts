import apiClient from './client';

export type Transaction = {
    id: string;
    senderEmail: string;
    recipientEmail: string;
    amount: string;
    createdAt: string;
};

export type PaginatedTransactions = {
    items: Transaction[];
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
};

export async function fetchTransactions(
    page = 1,
    limit = 10,
): Promise<PaginatedTransactions> {
    const response = await apiClient.get<PaginatedTransactions>('/transactions', {
        params: { page, limit },
    });
    return response.data;
}

export type TransferInput = {
    recipientEmail: string;
    amount: string;
};

export async function createTransfer(input: TransferInput): Promise<Transaction> {
    const response = await apiClient.post<Transaction>('/transactions', input);
    return response.data;
}