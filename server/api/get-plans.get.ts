import { defineEventHandler, getQuery } from 'h3';
import { db } from '../db';
import { plans } from '../db/schema';
import { eq, asc } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
    const { id } = getQuery(event);

    try {
        if (id) {
            const data = await db
                .select()
                .from(plans)
                .where(eq(plans.id, id as string));

            return { data };
        } else {
            const data = await db
                .select()
                .from(plans)
                .orderBy(asc(plans.sortIds));

            return { data };
        }
    } catch (error) {
        return { error };
    }
});
