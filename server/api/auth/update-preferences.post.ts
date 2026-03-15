import { defineEventHandler, readBody } from 'h3';
import { db } from '../../db';
import { people } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '../../utils/auth';

export default defineEventHandler(async (event) => {
    const { userId } = requireAuth(event);
    const { preferences } = await readBody(event);

    if (!preferences || typeof preferences !== 'object') {
        return { success: false, error: 'Missing preferences' };
    }

    try {
        // Merge with existing preferences
        const [person] = await db
            .select({ preferences: people.preferences })
            .from(people)
            .where(eq(people.userId, userId))
            .limit(1);

        const existing = (person?.preferences as Record<string, any>) || {};
        const merged = { ...existing, ...preferences };

        await db
            .update(people)
            .set({ preferences: merged })
            .where(eq(people.userId, userId));

        return { success: true, data: merged };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});
