import { defineEventHandler, getQuery } from 'h3';
import { db } from '../db';
import { people } from '../db/schema';
import { inArray } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
    const { ids } = getQuery(event);

    if (!ids) {
        return { error: 'ids is required' };
    }

    try {
        // ids can come as a single value or comma-separated or array
        let idArray: number[];
        if (Array.isArray(ids)) {
            idArray = ids.map(Number);
        } else {
            idArray = (ids as string).split(',').map(Number);
        }

        const data = await db
            .select()
            .from(people)
            .where(inArray(people.id, idArray));

        return { data };
    } catch (error) {
        return { error };
    }
});
