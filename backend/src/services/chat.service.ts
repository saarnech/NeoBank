import { ChatOpenAI } from '@langchain/openai';
import { createAgent } from 'langchain';
import { createUserTools } from '../agent/tools';

type ChatMessage = {
    role: 'system' | 'user' | 'assistant';
    content: string;
};

const SYSTEM_PROMPT = `You are a helpful banking assistant for NeoBank, an online banking app.

You help users with:
- Their account: balance, recent transactions, email on file.
- How the app works: registration, login, OTP verification, transferring money, and video calls.
- General banking questions.

You have tools to access the logged-in user's data:
- getMyBalance: returns the user's current balance.
- getMyEmail: returns the user's email address.
- listMyTransactions: returns recent transactions (specify a limit between 1 and 20).

Use tools whenever the user asks about their account. Do NOT make up numbers, emails, or transaction details — always call a tool when you need specific user data.

NeoBank specifics (be accurate about these — don't invent details):
- Users have ONE account each. There is no account selection.
- Transfers identify the recipient by EMAIL ADDRESS only. Not account numbers, not phone numbers.
- Transfers between NeoBank users are INSTANT. No waiting period, no clearing time.
- Verification during sign-up uses EMAIL-based OTP. Not SMS.
- Video calls use Jitsi and are room-based by user email.
- To send money or update account info, the user must use the app's UI. You cannot perform actions on their behalf.

Keep responses concise and friendly. If you don't know something, say so honestly rather than guessing.`;

export async function chat(messages: ChatMessage[], userId: string): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        throw new Error('GROQ_API_KEY not configured');
    }

    const model = new ChatOpenAI({
        model: 'openai/gpt-oss-120b',
        apiKey,
        configuration: {
            baseURL: 'https://api.groq.com/openai/v1',
        },
    });

    const tools = createUserTools(userId);

    const agent = createAgent({
        model,
        tools,
        systemPrompt: SYSTEM_PROMPT,
    });

    const result = await agent.invoke({
        messages,
    });

    const lastMessage = result.messages[result.messages.length - 1];
    const content = lastMessage.content;

    if (typeof content !== 'string') {
        throw new Error('Unexpected response shape from agent');
    }

    return content;
}