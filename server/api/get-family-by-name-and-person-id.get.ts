import { defineEventHandler, getQuery } from 'h3';
import { db } from '../db';
import { families } from '../db/schema';
import { eq, sql } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
    const { familyName, id } = getQuery(event);

    if (!familyName || !id) {
        return { error: 'familyName and id are required' };
    }

    try {
        const data = await db
            .select()
            .from(families)
            .where(
                sql`${families.familyName} = ${familyName} AND ${id}::uuid = ANY(${families.members})`
            );

        return { data };
    } catch (error) {
        return { error };
    }
});
