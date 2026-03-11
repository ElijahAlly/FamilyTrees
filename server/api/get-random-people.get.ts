import { defineEventHandler, getQuery } from 'h3';
import { db } from '../db';
import { people } from '../db/schema';
import { sql } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
    const { count } = getQuery(event);
    const numResults = count ? Number(count) : 12;

    try {
        const data = await db
            .select()
            .from(people)
            .orderBy(sql`RANDOM()`)
            .limit(numResults);

        return { data };
    } catch (error) {
        return { error };
    }
});
