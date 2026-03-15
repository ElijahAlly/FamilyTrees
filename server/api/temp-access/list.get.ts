import { defineEventHandler, getQuery } from 'h3';
import { db } from '../../db';
import { tempAccess } from '../../db/schema';
import { eq, or } from 'drizzle-orm';
import { requireAuth } from '../../utils/auth';
import { isAdminOrAbove } from '../../utils/permissions';

export default defineEventHandler(async (event) => {
    const { userId } = requireAuth(event);
    const { familyId } = getQuery(event);

    if (!familyId) {
        return { success: false, error: 'familyId is required' };
    }

    try {
        // Verify user is an admin
        const hasPermission = await isAdminOrAbove(userId, Number(familyId));
        if (!hasPermission) {
            return { success: false, error: 'Only admins can view temporary access records' };
        }

        // Get all temp access records where targetId matches familyId (for family type)
        // or any person-type access created by admins of this family
        const records = await db
            .select()
            .from(tempAccess)
            .where(or(
                eq(tempAccess.targetId, String(familyId)),
            ));

        // Enrich with status info
        const now = new Date();
        const enriched = records.map(r => ({
            ...r,
            isExpired: new Date(r.expiresAt) <= now,
            visitsExhausted: r.maxVisits !== null && (r.visitsUsed || 0) >= r.maxVisits,
        }));

        return { success: true, data: enriched };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});
