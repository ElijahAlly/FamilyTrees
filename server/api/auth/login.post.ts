import { defineEventHandler } from 'h3';
import { z } from 'zod/v4';
import { db } from '../../db';
import { authUsers, otpCodes } from '../../db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { validateBody } from '../../utils/validate';
import { checkRateLimit, authLimiter } from '../../utils/rate-limit';
import { sendOtpEmail } from '../../utils/email';

const loginSchema = z.object({
    email: z.email(),
});

export default defineEventHandler(async (event) => {
    checkRateLimit(event, authLimiter, 'login');

    const { email } = await validateBody(event, loginSchema);

    try {
        // Check if user exists
        const existing = await db
            .select({ id: authUsers.id })
            .from(authUsers)
            .where(eq(authUsers.email, email))
            .limit(1);

        if (existing.length === 0) {
            return { success: false, error: 'No account found with this email' };
        }

        // Generate OTP
        const otp = crypto.randomInt(100000, 999999).toString();

        // Store OTP in database with 10-minute expiry
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // Delete any existing OTPs for this email
        await db.delete(otpCodes).where(eq(otpCodes.email, email));

        await db.insert(otpCodes).values({
            email,
            code: otp,
            expiresAt,
        });

        const isDev = process.env.NODE_ENV !== 'production';

        // Send OTP email in production
        if (!isDev && process.env.RESEND_API_KEY) {
            await sendOtpEmail(email, otp);
        }

        return {
            success: true,
            message: 'OTP sent to email',
            ...(isDev ? { otp } : {})
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});
