import { defineEventHandler, getQuery } from 'h3';
import { db } from '../../db';
import { people } from '../../db/schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
    const { userId } = getQuery(event);

    if (!userId) {
        return { data: null, error: 'userId is required' };
    }

    try {
        const [profile] = await db
            .select()
            .from(people)
            .where(eq(people.userId, userId as string))
            .limit(1);

        return { data: profile || null };
    } catch (error) {
        return { data: null, error };
    }
});
