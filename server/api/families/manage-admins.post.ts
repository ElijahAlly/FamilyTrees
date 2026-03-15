import { defineEventHandler, readBody } from 'h3';
import { db } from '../../db';
import { families, familyMemberships, people, authUsers } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../../utils/auth';
import { isAdminOrAbove } from '../../utils/permissions';

export default defineEventHandler(async (event) => {
    const { userId } = requireAuth(event);
    const { familyId, action, targetUserId } = await readBody(event);

    if (!familyId || !action || !targetUserId) {
        return { success: false, error: 'familyId, action, and targetUserId are required' };
    }

    if (!['add_admin', 'remove_admin', 'transfer_admin'].includes(action)) {
        return { success: false, error: 'action must be add_admin, remove_admin, or transfer_admin' };
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

        const admins = (family.admins || []) as string[];

        const hasPermission = await isAdminOrAbove(userId, Number(familyId));
        if (!hasPermission) {
            return { success: false, error: 'You are not an admin of this family' };
        }

        // Verify target user is an active member of the family
        const [membership] = await db
            .select()
            .from(familyMemberships)
            .where(and(
                eq(familyMemberships.familyId, Number(familyId)),
                eq(familyMemberships.userId, targetUserId),
                eq(familyMemberships.status, 'active')
            ))
            .limit(1);

        if (!membership) {
            return { success: false, error: 'Target user is not an active member of this family' };
        }

        let newAdmins: string[];

        if (action === 'add_admin') {
            if (admins.includes(targetUserId)) {
                return { success: false, error: 'User is already an admin' };
            }
            newAdmins = [...admins, targetUserId];
        } else if (action === 'remove_admin') {
            if (!admins.includes(targetUserId)) {
                return { success: false, error: 'User is not an admin' };
            }
            if (admins.length <= 1) {
                return { success: false, error: 'Cannot remove the last admin. Transfer admin rights first.' };
            }
            if (targetUserId === userId) {
                return { success: false, error: 'Cannot remove yourself as admin. Transfer admin rights first.' };
            }
            newAdmins = admins.filter(a => a !== targetUserId);
        } else {
            // transfer_admin: remove self, add target
            if (admins.includes(targetUserId)) {
                // Target is already admin, just remove self
                newAdmins = admins.filter(a => a !== userId);
            } else {
                newAdmins = [...admins.filter(a => a !== userId), targetUserId];
            }
            if (newAdmins.length === 0) {
                newAdmins = [targetUserId];
            }
        }

        const [updated] = await db
            .update(families)
            .set({ admins: newAdmins })
            .where(eq(families.id, Number(familyId)))
            .returning();

        return { success: true, data: updated };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});
