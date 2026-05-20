import { prisma } from '../utils/prismaClient';
import type {
    Transaction,
    TransferRequest,
    PaginatedTransactions,
} from '../types/transaction';
import type { Server as SocketServer } from 'socket.io';

// --- Custom error classes ---

export class InvalidTransferError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'InvalidTransferError';
    }
}

export class RecipientNotFoundError extends Error {
    constructor() {
        super('Recipient email not found');
        this.name = 'RecipientNotFoundError';
    }
}

export class InsufficientBalanceError extends Error {
    constructor() {
        super('Insufficient balance');
        this.name = 'InsufficientBalanceError';
    }
}

export class SelfTransferError extends Error {
    constructor() {
        super('Cannot transfer to yourself');
        this.name = 'SelfTransferError';
    }
}

// --- Helper: convert a Prisma transaction row to our Transaction type ---

async function toTransaction(row: {
    id: string;
    senderId: string;
    receiverId: string;
    amount: { toString(): string };
    createdAt: Date;
}): Promise<Transaction> {
    // We need sender/receiver emails for the response, but the row only has IDs.
    // Fetch both users in one query.
    const [sender, receiver] = await Promise.all([
        prisma.user.findUnique({ where: { id: row.senderId } }),
        prisma.user.findUnique({ where: { id: row.receiverId } }),
    ]);

    return {
        id: row.id,
        senderEmail: sender?.email ?? '(unknown)',
        recipientEmail: receiver?.email ?? '(unknown)',
        amount: row.amount.toString(),
        createdAt: row.createdAt,
    };
}

// --- Public service functions ---

export async function createTransaction(
    senderId: string,
    input: TransferRequest,
    io?: SocketServer,
): Promise<Transaction> {
    const { recipientEmail, amount } = input;

    // Input validation
    if (!recipientEmail || !amount) {
        throw new InvalidTransferError('recipientEmail and amount are required');
    }

    // Validate amount: must be a positive number, max 2 decimal places
    if (!/^\d+(\.\d{1,2})?$/.test(amount)) {
        throw new InvalidTransferError('amount must be a positive decimal with up to 2 places');
    }
    if (Number(amount) <= 0) {
        throw new InvalidTransferError('amount must be greater than zero');
    }

    // Run the transfer in a database transaction
    const result = await prisma.$transaction(async (tx) => {
        // Lock the sender's row for the duration of this transaction.
        // Without this, two concurrent transfers could both pass the balance check.
        const senderRows = await tx.$queryRaw<Array<{
            id: string;
            email: string;
            balance: { toString(): string };
        }>>`SELECT id, email, balance FROM users WHERE id = ${senderId} FOR UPDATE`;

        if (senderRows.length === 0) {
            throw new InvalidTransferError('Sender not found');
        }
        const sender = senderRows[0];

        // Look up the recipient by email
        const recipient = await tx.user.findUnique({
            where: { email: recipientEmail.toLowerCase() },
        });

        if (!recipient) {
            throw new RecipientNotFoundError();
        }

        if (recipient.id === sender.id) {
            throw new SelfTransferError();
        }

        // Compare balance to amount (both as decimal strings via Number for arithmetic)
        // For real banking, you'd use Decimal arithmetic to avoid float concerns.
        // For our scale (2 decimal places, amounts up to billions), Number is safe.
        const senderBalance = Number(sender.balance.toString());
        const amountNum = Number(amount);

        if (senderBalance < amountNum) {
            throw new InsufficientBalanceError();
        }

        // Atomic: debit, credit, create transaction record
        await tx.user.update({
            where: { id: sender.id },
            data: { balance: { decrement: amount } },
        });

        await tx.user.update({
            where: { id: recipient.id },
            data: { balance: { increment: amount } },
        });

        const transaction = await tx.transaction.create({
            data: {
                senderId: sender.id,
                receiverId: recipient.id,
                amount,
            },
        });

        return {
            ...transaction,
            senderEmail: sender.email,
            recipientEmail: recipient.email,
        };
    });

    // Notify the recipient in real time (if Socket.IO is available)
    if (io) {
        io.to(`user:${result.receiverId}`).emit('transaction:received', {
            id: result.id,
            senderEmail: result.senderEmail,
            recipientEmail: result.recipientEmail,
            amount: result.amount.toString(),
            createdAt: result.createdAt,
        });
    }

    return {
        id: result.id,
        senderEmail: result.senderEmail,
        recipientEmail: result.recipientEmail,
        amount: result.amount.toString(),
        createdAt: result.createdAt,
    };
}

export async function listTransactions(
    userId: string,
    page: number,
    limit: number,
): Promise<PaginatedTransactions> {
    // Get user's transactions (as sender or receiver), newest first
    const [items, totalItems] = await Promise.all([
        prisma.transaction.findMany({
            where: {
                OR: [{ senderId: userId }, { receiverId: userId }],
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
            include: {
                sender: { select: { email: true } },
                receiver: { select: { email: true } },
            },
        }),
        prisma.transaction.count({
            where: {
                OR: [{ senderId: userId }, { receiverId: userId }],
            },
        }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
        items: items.map((t) => ({
            id: t.id,
            senderEmail: t.sender.email,
            recipientEmail: t.receiver.email,
            amount: t.amount.toString(),
            createdAt: t.createdAt,
        })),
        page,
        limit,
        totalItems,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
    };
}