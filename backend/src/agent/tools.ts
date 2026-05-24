import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { findUserById } from '../services/user.service';
import { listTransactions } from '../services/transaction.service';

export function createUserTools(userId: string) {
    const getMyBalance = tool(
        async () => {
            console.log(`[tool] getMyBalance called for userId=${userId}`);
            const user = await findUserById(userId);
            if (!user) {
                return 'User not found.';
            }
            return `Balance: $${user.balance}`;
        },
        {
            name: 'getMyBalance',
            description: 'Returns the current balance of the logged-in user. Use this whenever the user asks about their balance.',
            schema: z.object({}),
        }
    );

    const listMyTransactions = tool(
        async ({ limit }: { limit: number }) => {
            console.log(`[tool] listMyTransactions called for userId=${userId}, limit=${limit}`);
            const user = await findUserById(userId);
            if (!user) {
                return 'User not found.';
            }
            const result = await listTransactions(userId, 1, limit);
            if (result.items.length === 0) {
                return 'No transactions found.';
            }
            const lines = result.items.map((tx) => {
                const isSender = tx.senderEmail === user.email;
                const direction = isSender ? `sent to ${tx.recipientEmail}` : `received from ${tx.senderEmail}`;
                const sign = isSender ? '-' : '+';
                const date = tx.createdAt instanceof Date ? tx.createdAt.toISOString() : tx.createdAt;
                return `${date}: ${direction}, ${sign}$${tx.amount}`;
            });
            return `Recent transactions:\n${lines.join('\n')}`;
        },
        {
            name: 'listMyTransactions',
            description: 'Returns the recent transactions of the logged-in user (both sent and received). Provide a limit between 1 and 20.',
            schema: z.object({
                limit: z.number().int().min(1).max(20).describe('Number of recent transactions to return'),
            }),
        }
    );

    return [getMyBalance, listMyTransactions];
}