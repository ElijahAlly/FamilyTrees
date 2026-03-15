import { defineEventHandler, getQuery } from 'h3';
import { db } from '../../db';
import { families } from '../../db/schema';
import { ilike } from 'drizzle-orm';


export default defineEventHandler(async (event) => {
    const { lastName } = getQuery(event);

    if (!lastName || typeof lastName !== 'string') {
        return { data: [] };
    }

    try {
        const data = await db
            .select()
            .from(families)
            .where(ilike(families.familyName, `%${lastName.trim()}%`));

        return { data };
    } catch (error: any) {
        return { data: [], error: error.message };
    }
});
