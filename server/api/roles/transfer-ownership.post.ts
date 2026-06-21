import { defineEventHandler, readBody } from 'h3';
import { db } from '../../db';
import { familyRoles, families } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../../utils/auth';

export default defineEventHandler(async (event) => {
    const { userId } = requireAuth(event);
    const { familyId, newOwnerId } = await readBody(event);
    const currentOwnerId = userId;

    if (!familyId || !newOwnerId) {
        return { success: false, error: 'familyId and newOwnerId are required' };
    }

    if (currentOwnerId === newOwnerId) {
        return { success: false, error: 'Cannot transfer ownership to yourself' };
    }

    try {
        // Verify current owner
        const [currentOwnerRole] = await db
            .select()
            .from(familyRoles)
            .where(and(
                eq(familyRoles.familyId, Number(familyId)),
                eq(familyRoles.userId, currentOwnerId),
                eq(familyRoles.role, 'owner')
            ))
            .limit(1);

        if (!currentOwnerRole) {
            return { success: false, error: 'You are not the owner of this family' };
        }

        // Verify new owner has a role in the family
        const [newOwnerRole] = await db
            .select()
            .from(familyRoles)
            .where(and(
                eq(familyRoles.familyId, Number(familyId)),
                eq(familyRoles.userId, newOwnerId)
            ))
            .limit(1);

        if (!newOwnerRole) {
            return { success: false, error: 'The target user is not a member of this family' };
        }

        // Demote current owner to admin
        await db
            .update(familyRoles)
            .set({ role: 'admin', assignedBy: currentOwnerId, updatedAt: new Date() })
            .where(eq(familyRoles.id, currentOwnerRole.id));

        // Promote new owner
        await db
            .update(familyRoles)
            .set({ role: 'owner', assignedBy: currentOwnerId, updatedAt: new Date() })
            .where(eq(familyRoles.id, newOwnerRole.id));

        // Update denormalized ownerId
        await db
            .update(families)
            .set({ ownerId: newOwnerId })
            .where(eq(families.id, Number(familyId)));

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});
