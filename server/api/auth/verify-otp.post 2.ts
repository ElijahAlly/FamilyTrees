import { defineEventHandler, readBody } from 'h3';
import { db } from '../../db';
import { authUsers, people } from '../../db/schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
    const { email, token } = await readBody(event);

    if (!email || !token) {
        return { success: false, error: 'Email and token are required' };
    }

    try {
        // TODO: Validate OTP against stored value (Redis, DB, etc.)
        // For now in development, accept any 6-digit code
        const isDev = process.env.NODE_ENV !== 'production';

        if (!isDev) {
            // In production, verify OTP against stored value
            return { success: false, error: 'OTP verification not yet configured for production' };
        }

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

        return {
            success: true,
            user: {
                id: user.id,
                email: user.email,
                createdAt: user.createdAt,
            },
            profile: profile || null
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});
