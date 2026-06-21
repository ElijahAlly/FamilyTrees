import { defineEventHandler, readBody } from 'h3';
import { db } from '../../db';
import { families, familyMemberships, activityLogs } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../../utils/auth';
import { isAdminOrAbove } from '../../utils/permissions';

export default defineEventHandler(async (event) => {
    const { userId } = requireAuth(event);
    const { familyId, action } = await readBody(event);

    if (!familyId || !action) {
        return { success: false, error: 'familyId and action are required' };
    }

    if (!['archive', 'restore'].includes(action)) {
        return { success: false, error: 'action must be archive or restore' };
    }

    try {
        const [family] = await db
            .select()
            .from(families)
            .where(eq(families.id, Number(familyId)))
            .limit(1);

        if (!family) {
            return { success: false, error: 'Family not found' };
        }

        const hasPermission = await isAdminOrAbove(userId, Number(familyId));
        if (!hasPermission) {
            return { success: false, error: 'Only admins can archive or restore a family' };
        }

        if (action === 'archive') {
            if (family.archivedAt) {
                return { success: false, error: 'Family is already archived' };
            }

            // Archive the family (soft delete)
            const [updated] = await db
                .update(families)
                .set({ archivedAt: new Date() })
                .where(eq(families.id, Number(familyId)))
                .returning();

            // Mark all memberships as removed
            const memberships = await db
                .select()
                .from(familyMemberships)
                .where(and(
                    eq(familyMemberships.familyId, Number(familyId)),
                    eq(familyMemberships.status, 'active')
                ));

            for (const m of memberships) {
                await db
                    .update(familyMemberships)
                    .set({ status: 'removed', removedAt: new Date() })
                    .where(eq(familyMemberships.id, m.id));
            }

            return { success: true, data: updated };
        } else {
            // Restore
            if (!family.archivedAt) {
                return { success: false, error: 'Family is not archived' };
            }

            const [updated] = await db
                .update(families)
                .set({ archivedAt: null })
                .where(eq(families.id, Number(familyId)))
                .returning();

            // Restore memberships that were removed when archived
            const removedMemberships = await db
                .select()
                .from(familyMemberships)
                .where(and(
                    eq(familyMemberships.familyId, Number(familyId)),
                    eq(familyMemberships.status, 'removed')
                ));

            for (const m of removedMemberships) {
                await db
                    .update(familyMemberships)
                    .set({ status: 'active', removedAt: null })
                    .where(eq(familyMemberships.id, m.id));
            }

            return { success: true, data: updated };
        }
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});
