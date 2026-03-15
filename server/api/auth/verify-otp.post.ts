import { defineEventHandler } from 'h3';
import { z } from 'zod/v4';
import { db } from '../../db';
import { authUsers, people, otpCodes } from '../../db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { validateBody } from '../../utils/validate';
import { checkRateLimit, authLimiter } from '../../utils/rate-limit';
import { signToken } from '../../utils/jwt';

const verifyOtpSchema = z.object({
    email: z.email(),
    token: z.string().min(6).max(6),
});

export default defineEventHandler(async (event) => {
    checkRateLimit(event, authLimiter, 'verify-otp');

    const { email, token } = await validateBody(event, verifyOtpSchema);

    try {
        const isDev = process.env.NODE_ENV !== 'production';

        // Validate OTP against stored value
        const [storedOtp] = await db
            .select()
            .from(otpCodes)
            .where(and(
                eq(otpCodes.email, email),
                eq(otpCodes.code, token),
                gt(otpCodes.expiresAt, new Date())
            ))
            .limit(1);

        if (!storedOtp) {
            // In dev mode, accept any 6-digit code as fallback for easier testing
            if (!isDev) {
                return { success: false, error: 'Invalid or expired verification code' };
            }
        }

        // Delete used OTP
        await db.delete(otpCodes).where(eq(otpCodes.email, email));

        // Look up the user
        const [user] = await db
            .select()
            .from(authUsers)
            .where(eq(authUsers.email, email))
            .limit(1);

        if (!user) {
            return { success: false, error: 'User not found' };
        }

        // Get the person profile
        const [profile] = await db
            .select()
            .from(people)
            .where(eq(people.userId, user.id))
            .limit(1);

        // Generate JWT token
        const jwt = await signToken({ userId: user.id, email: user.email });

        return {
            success: true,
            token: jwt,
            user: {
                id: user.id,
                email: user.email,
                createdAt: user.createdAt,
            },
            profile: profile || null,
            onboardingCompleted: profile ? (profile.onboardingCompleted ?? false) : false,
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});
