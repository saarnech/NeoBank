import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM;

if (!RESEND_API_KEY || !EMAIL_FROM) {
    throw new Error('RESEND_API_KEY and EMAIL_FROM must be set in environment');
}

const resend = new Resend(RESEND_API_KEY);
const from: string = EMAIL_FROM;

export async function sendEmail(
    to: string,
    subject: string,
    text: string,
): Promise<void> {
    const { error } = await resend.emails.send({
        from,
        to,
        subject,
        text,
    });

    if (error) {
        throw new Error(`Failed to send email: ${error.message}`);
    }
}

export async function verifyEmailConfig(): Promise<void> {
    // Resend has no "verify credentials" endpoint analogous to SMTP's `verify`.
    // We do a minimal sanity check: API key + from address are set.
    // Real validation happens on first send.
    if (!RESEND_API_KEY || !EMAIL_FROM) {
        throw new Error('Email configuration missing');
    }
}