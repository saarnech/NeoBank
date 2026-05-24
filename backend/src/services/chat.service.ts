type ChatMessage = {
    role: 'system' | 'user' | 'assistant';
    content: string;
};

const SYSTEM_PROMPT = `You are a helpful customer service assistant for NeoBank, an online banking app.

You help users understand how the app works: registration, login, OTP verification, viewing their balance, transferring money, and using video calls.

You can answer general banking questions (what is a wire transfer? what's a balance? etc.) but you do NOT have access to any specific user's account, balance, or transaction data.

If a user asks you to perform an action (transfer money, change their email, etc.), explain that you can only provide guidance — they need to use the app's features themselves.

Keep responses concise and friendly. If you don't know something, say so.`;

export async function chat(messages: ChatMessage[]): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        throw new Error('GROQ_API_KEY not configured');
    }

    const fullMessages: ChatMessage[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: fullMessages,
            temperature: 0.7,
            max_tokens: 500,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (typeof content !== 'string') {
        throw new Error('Unexpected response shape from Groq');
    }

    return content;
}