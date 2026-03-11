import { defineEventHandler, getQuery } from 'h3';
import { db } from '../db';
import { activityLogs } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
    const { familyId, limit } = getQuery(event);

    if (!familyId) {
        return { data: [] };
    }

    try {
        const limitNum = limit ? Number(limit) : 20;

        const data = await db
            .select()
            .from(activityLogs)
            .where(eq(activityLogs.familyId, Number(familyId)))
            .orderBy(desc(activityLogs.createdAt))
            .limit(limitNum);

        return { data };
    } catch (error) {
        return { data: [], error };
    }
});
