import { defineEventHandler, readBody } from 'h3';
import { db } from '../../db';
import { authUsers, people } from '../../db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export default defineEventHandler(async (event) => {
    const { email, username } = await readBody(event);

    if (!email) {
        return { success: false, error: 'Email is required' };
    }

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
                firstName: username || email.split('@')[0],
                lastName: '',
                userId: newUser.id,
                createdBy: newUser.id,
            })
            .returning();

        // Generate a simple OTP (in production, send this via email)
        const otp = crypto.randomInt(100000, 999999).toString();

        // TODO: Store OTP in a temporary store (Redis, DB table, or in-memory)
        // and send it via email. For now, return it in development.
        const isDev = process.env.NODE_ENV !== 'production';

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
