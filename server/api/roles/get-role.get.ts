import { defineEventHandler, getQuery } from 'h3';
import { db } from '../../db';
import { familyRoles } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../../utils/auth';

export default defineEventHandler(async (event) => {
    const { userId } = requireAuth(event);
    const { familyId } = getQuery(event);

    if (!familyId) {
        return { data: null, error: 'familyId is required' };
    }

    try {
        const [role] = await db
            .select()
            .from(familyRoles)
            .where(and(
                eq(familyRoles.userId, userId),
                eq(familyRoles.familyId, Number(familyId))
            ))
            .limit(1);

        return { data: role || null };
    } catch (error: any) {
        return { data: null, error: error.message };
    }
});
