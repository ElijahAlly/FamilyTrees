import { defineEventHandler, getQuery } from 'h3';
import { db } from '../db';
import { marriages } from '../db/schema';
import { or, inArray } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
    const { memberIds } = getQuery(event);

    if (!memberIds) {
        return { error: 'memberIds is required' };
    }

    try {
        const ids = (memberIds as string).split(',').map(Number);

        const data = await db
            .select()
            .from(marriages)
            .where(
                or(
                    inArray(marriages.person1Id, ids),
                    inArray(marriages.person2Id, ids)
                )
            );

        return { data };
    } catch (error) {
        return { error };
    }
});
