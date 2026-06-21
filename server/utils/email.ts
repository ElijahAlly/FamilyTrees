import { Resend } from 'resend';

let resendClient: Resend | null = null;

function getResend(): Resend {
    if (!resendClient) {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) throw new Error('RESEND_API_KEY environment variable is required');
        resendClient = new Resend(apiKey);
    }
    return resendClient;
}

export async function sendOtpEmail(to: string, otp: string): Promise<void> {
    const resend = getResend();
    await resend.emails.send({
        from: process.env.EMAIL_FROM || 'MyTrees <noreply@mytrees.family>',
        to,
        subject: 'Your MyTrees verification code',
        html: `
            <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #18181b;">Your verification code</h2>
                <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #18181b; background: #f4f4f5; padding: 16px; border-radius: 8px; text-align: center;">
                    ${otp}
                </p>
                <p style="color: #71717a; font-size: 14px;">This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
            </div>
        `,
    });
}
