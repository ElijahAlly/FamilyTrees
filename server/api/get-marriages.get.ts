import { defineEventHandler, getQuery } from 'h3';
import { db } from '../db';
import { marriages } from '../db/schema';
import { eq, or } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
    const { personId } = getQuery(event);

    if (!personId) {
        return { error: 'personId is required' };
    }

    const id = Number(personId);

    try {
        const data = await db
            .select()
            .from(marriages)
            .where(
                or(
                    eq(marriages.person1Id, id),
                    eq(marriages.person2Id, id)
                )
            );

        return { data };
    } catch (error) {
        return { error };
    }
});
