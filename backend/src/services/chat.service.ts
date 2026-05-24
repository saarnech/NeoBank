type ChatMessage = {
    role: 'system' | 'user' | 'assistant';
    content: string;
};

const SYSTEM_PROMPT = `You are a helpful customer service assistant for NeoBank, an online banking app.

You help users understand how the app works: registration, login, OTP verification, viewing their balance, transferring money, and using video calls.

You can answer general banking questions (what is a wire transfer? what's a balance? etc.) but you do NOT have access to any specific user's account, balance, or transaction data.

NeoBank specifics (be accurate about these — don't invent details):
- Users have ONE account each. There is no account selection.
- Transfers identify the recipient by EMAIL ADDRESS only. Not account numbers, not phone numbers.
- Transfers between NeoBank users are INSTANT. No waiting period, no clearing time.
- Verification during sign-up uses EMAIL-based OTP. Not SMS.
- Video calls use Jitsi and are room-based by user email.
- For balance and transaction history, tell users to check their dashboard directly.
- An "AI Banking Assistant" with access to user data is coming soon — for now, account-specific actions must be done via the app's UI.

If a user asks you to perform an action (transfer money, change their email, etc.), explain that you can only provide guidance — they need to use the app's features themselves.

Keep responses concise and friendly. If you don't know something, say so honestly rather than guessing.`;

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