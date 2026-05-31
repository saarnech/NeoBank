import * as brevo from '@getbrevo/brevo';

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM;
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'NeoBank';

if (!BREVO_API_KEY || !EMAIL_FROM) {
    throw new Error('BREVO_API_KEY and EMAIL_FROM must be set in environment');
}

const from: string = EMAIL_FROM;
const apiKey: string = BREVO_API_KEY;

const apiInstance = new brevo.TransactionalEmailsApi();
// The SDK's TypeScript types don't quite match its runtime shape — `as any` documented in Brevo's own README.
(apiInstance as any).authentications.apiKey.apiKey = apiKey;

export async function sendEmail(
    to: string,
    subject: string,
    text: string,
): Promise<void> {
    const message = new brevo.SendSmtpEmail();
    message.sender = { name: EMAIL_FROM_NAME, email: from };
    message.to = [{ email: to }];
    message.subject = subject;
    message.textContent = text;

    try {
        await apiInstance.sendTransacEmail(message);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        throw new Error(`Failed to send email: ${errorMessage}`);
    }
}

export async function verifyEmailConfig(): Promise<void> {
    if (!BREVO_API_KEY || !EMAIL_FROM) {
        throw new Error('Email configuration missing');
    }
}