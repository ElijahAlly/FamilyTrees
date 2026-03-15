import { defineEventHandler } from 'h3';
import { db } from '../../db';
import { people } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '../../utils/auth';

export default defineEventHandler(async (event) => {
    const { userId } = requireAuth(event);

    try {
        const [profile] = await db
            .select()
            .from(people)
            .where(eq(people.userId, userId))
            .limit(1);

        return { data: profile || null };
    } catch (error) {
        return { data: null, error };
    }
});
