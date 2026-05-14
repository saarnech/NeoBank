import nodemailer from 'nodemailer';

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM;

if (!EMAIL_USER || !EMAIL_PASS || !EMAIL_FROM) {
    throw new Error('EMAIL_USER, EMAIL_PASS, and EMAIL_FROM must be set in environment');
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
    },
});

export async function sendEmail(
    to: string,
    subject: string,
    text: string,
): Promise<void> {
    await transporter.sendMail({
        from: EMAIL_FROM,
        to,
        subject,
        text,
    });
}

export async function verifyEmailConfig(): Promise<void> {
    // Asks Gmail to confirm credentials work. Useful at startup.
    await transporter.verify();
}