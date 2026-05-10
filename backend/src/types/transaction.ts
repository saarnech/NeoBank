export type Transaction = {
    id: string;
    senderEmail: string;
    recipientEmail: string;
    amount: string;
    createdAt: Date;
};

export type TransferRequest = {
    recipientEmail: string;
    amount: string;
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