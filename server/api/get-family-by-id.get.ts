import { defineEventHandler, getQuery } from 'h3';
import { db } from '../db';
import { families, people } from '../db/schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
    const { id } = getQuery(event);

    if (!id) {
        return { error: 'id is required' };
    }

    try {
        const data = await db
            .select()
            .from(families)
            .where(eq(families.id, Number(id)));

        return { data };
    } catch (error) {
        return { error };
    }
});
