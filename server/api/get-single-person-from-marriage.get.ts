import { defineEventHandler, getQuery } from 'h3';
import { db } from '../db';
import { people } from '../db/schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
    const { spouseId } = getQuery(event);

    if (!spouseId) {
        return { error: 'spouseId is required' };
    }

    try {
        const data = await db
            .select()
            .from(people)
            .where(eq(people.id, Number(spouseId)));

        return { data };
    } catch (error) {
        return { error };
    }
});
