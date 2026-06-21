import { defineEventHandler, getQuery } from 'h3';
import { db } from '../../db';
import { families, mergeRequests } from '../../db/schema';
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
            return { success: false, error: 'Only admins can view merge requests' };
        }

        // Get merge requests where this family is source or target
        const requests = await db
            .select()
            .from(mergeRequests)
            .where(or(
                eq(mergeRequests.sourceFamilyId, Number(familyId)),
                eq(mergeRequests.targetFamilyId, Number(familyId)),
            ));

        // Enrich with family names
        const enriched = await Promise.all(requests.map(async (r) => {
            const [source] = await db
                .select({ familyName: families.familyName })
                .from(families)
                .where(eq(families.id, r.sourceFamilyId))
                .limit(1);

            const [target] = await db
                .select({ familyName: families.familyName })
                .from(families)
                .where(eq(families.id, r.targetFamilyId))
                .limit(1);

            return {
                ...r,
                sourceFamilyName: source?.familyName || 'Unknown',
                targetFamilyName: target?.familyName || 'Unknown',
                conflictCount: (r.conflicts as any[])?.length || 0,
            };
        }));

        return { success: true, data: enriched };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});
