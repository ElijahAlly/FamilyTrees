import { defineEventHandler } from 'h3';
import { z } from 'zod/v4';
import { db } from '../../db';
import { authUsers, people, otpCodes } from '../../db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { validateBody } from '../../utils/validate';
import { checkRateLimit, signupLimiter } from '../../utils/rate-limit';
import { sendOtpEmail } from '../../utils/email';

const signupSchema = z.object({
    email: z.email(),
    firstName: z.string().min(1).optional(),
    lastName: z.string().optional(),
    username: z.string().optional(),
});

export default defineEventHandler(async (event) => {
    checkRateLimit(event, signupLimiter, 'signup');

    const { email, firstName, lastName, username } = await validateBody(event, signupSchema);

    // Support both old (username) and new (firstName/lastName) formats
    const resolvedFirstName = firstName || username || email.split('@')[0];
    const resolvedLastName = lastName || '';

    try {
        // Check if user already exists
        const existing = await db
            .select({ id: authUsers.id })
            .from(authUsers)
            .where(eq(authUsers.email, email))
            .limit(1);

        if (existing.length > 0) {
            return { success: false, error: 'An account with this email already exists' };
        }

        // Create the auth user
        const [newUser] = await db
            .insert(authUsers)
            .values({ email })
            .returning();

        // Create a corresponding person record
        const [newPerson] = await db
            .insert(people)
            .values({
                firstName: resolvedFirstName,
                lastName: resolvedLastName,
                userId: newUser.id,
                createdBy: newUser.id,
                onboardingCompleted: false,
            })
            .returning();

        // Generate OTP and store in database
        const otp = crypto.randomInt(100000, 999999).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await db.delete(otpCodes).where(eq(otpCodes.email, email));
        await db.insert(otpCodes).values({ email, code: otp, expiresAt });

        const isDev = process.env.NODE_ENV !== 'production';

        // Send OTP email in production
        if (!isDev && process.env.RESEND_API_KEY) {
            await sendOtpEmail(email, otp);
        }

        return {
            success: true,
            message: 'OTP sent to email',
            userId: newUser.id,
            personId: newPerson.id,
            ...(isDev ? { otp } : {})
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});
