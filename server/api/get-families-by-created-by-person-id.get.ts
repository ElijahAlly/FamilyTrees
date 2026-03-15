import { defineEventHandler, getQuery } from 'h3';
import { db } from '../db';
import { families } from '../db/schema';
import { eq } from 'drizzle-orm';


export default defineEventHandler(async (event) => {
    const { personId, limit } = getQuery(event);

    if (!personId) {
        return { error: 'personId is required' };
    }

    try {
        const limitNum = limit ? Number(limit) : undefined;

        let query = db
            .select()
            .from(families)
            .where(eq(families.createdBy, Number(personId)));

        if (limitNum) {
            const data = await query.limit(limitNum);
            return { data };
        }

        const data = await query;
        return { data };
    } catch (error) {
        return { error };
    }
});
