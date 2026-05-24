import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';
import { createAgent } from 'langchain';
import { createUserTools } from '../agent/tools';

async function main() {
    // Hardcode a real user for testing — use a userId from your DB
    const TEST_USER_ID = process.argv[2];
    if (!TEST_USER_ID) {
        console.error('Usage: npm run hello-agent <userId>');
        console.error('Hint: query your DB: SELECT id, email FROM users LIMIT 5;');
        process.exit(1);
    }

    const model = new ChatOpenAI({
        model: 'openai/gpt-oss-120b',
        apiKey: process.env.GROQ_API_KEY,
        configuration: {
            baseURL: 'https://api.groq.com/openai/v1',
        },
    });

    const tools = createUserTools(TEST_USER_ID);

    const agent = createAgent({
        model,
        tools,
        systemPrompt: `You are a helpful banking assistant for NeoBank.
You have access to tools that fetch the logged-in user's data:
- getMyBalance: returns their current balance.
- listMyTransactions: returns recent transactions (specify a limit).

Use tools whenever the user asks about their account. Don't make up answers — call a tool.`,
    });

    const questions = [
        "What's my balance?",
        'Show me my last 5 transactions.',
        "What's my email address?",
    ];

    for (const question of questions) {
        console.log(`\n[user] ${question}`);
        const result = await agent.invoke({
            messages: [{ role: 'user', content: question }],
        });
        const lastMessage = result.messages[result.messages.length - 1];
        console.log(`[agent] ${lastMessage.content}`);
    }
}

main().catch((err) => {
    console.error('Error:', err);
    process.exit(1);
});