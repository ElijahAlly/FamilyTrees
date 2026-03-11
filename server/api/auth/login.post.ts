import { defineEventHandler, readBody } from 'h3';
import { db } from '../../db';
import { authUsers } from '../../db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export default defineEventHandler(async (event) => {
    const { email } = await readBody(event);

    if (!email) {
        return { success: false, error: 'Email is required' };
    }

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

        // TODO: Store OTP and send via email service
        const isDev = process.env.NODE_ENV !== 'production';

        return {
            success: true,
            message: 'OTP sent to email',
            ...(isDev ? { otp } : {})
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});
