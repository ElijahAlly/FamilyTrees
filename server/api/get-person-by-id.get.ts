import { defineEventHandler, getQuery } from 'h3';
import { db } from '../db';
import { people } from '../db/schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
    const { id } = getQuery(event);

    if (!id) {
        return { error: 'id is required' };
    }

    try {
        const data = await db
            .select()
            .from(people)
            .where(eq(people.id, Number(id)))
            .limit(1);

        return { data: data[0] ?? null };
    } catch (error) {
        return { error };
    }
});
