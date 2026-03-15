import { defineEventHandler, readBody } from 'h3';
import { db } from '../../db';
import { familyRoles, families } from '../../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import type { FamilyRole } from '../../../types/roles';
import { requireAuth } from '../../utils/auth';

const ROLE_HIERARCHY: Record<FamilyRole, number> = {
    owner: 5,
    banker: 4,
    admin: 3,
    member: 2,
    guest: 1,
};

export default defineEventHandler(async (event) => {
    const { userId } = requireAuth(event);
    const { familyId, targetUserId, role, isInitialOwner } = await readBody(event);

    if (!familyId || !targetUserId || !role) {
        return { success: false, error: 'familyId, targetUserId, and role are required' };
    }

    const validRoles: FamilyRole[] = ['owner', 'banker', 'admin', 'member', 'guest'];
    if (!validRoles.includes(role)) {
        return { success: false, error: `role must be one of: ${validRoles.join(', ')}` };
    }

    try {
        // Special case: initial owner assignment during family creation
        if (isInitialOwner && role === 'owner') {
            // Upsert the role
            const existing = await db
                .select()
                .from(familyRoles)
                .where(and(
                    eq(familyRoles.familyId, Number(familyId)),
                    eq(familyRoles.userId, targetUserId)
                ))
                .limit(1);

            if (existing.length > 0) {
                await db
                    .update(familyRoles)
                    .set({ role: 'owner', updatedAt: new Date() })
                    .where(eq(familyRoles.id, existing[0].id));
            } else {
                await db
                    .insert(familyRoles)
                    .values({
                        familyId: Number(familyId),
                        userId: targetUserId,
                        role: 'owner',
                        assignedBy: targetUserId,
                    });
            }

            // Set ownerId on family
            await db
                .update(families)
                .set({ ownerId: targetUserId })
                .where(eq(families.id, Number(familyId)));

            return { success: true };
        }

        // Normal role assignment
        // Get actor's role
        const [actorRole] = await db
            .select()
            .from(familyRoles)
            .where(and(
                eq(familyRoles.familyId, Number(familyId)),
                eq(familyRoles.userId, userId)
            ))
            .limit(1);

        if (!actorRole) {
            return { success: false, error: 'You do not have a role in this family' };
        }

        const actorLevel = ROLE_HIERARCHY[actorRole.role as FamilyRole] || 0;

        // Permission checks
        if (role === 'owner') {
            return { success: false, error: 'Use the transfer-ownership endpoint to change the owner' };
        }

        if (role === 'banker') {
            if (actorRole.role !== 'owner') {
                return { success: false, error: 'Only the owner can assign the banker role' };
            }
            // Check max 3 bankers
            const bankerCount = await db
                .select({ count: sql<number>`count(*)` })
                .from(familyRoles)
                .where(and(
                    eq(familyRoles.familyId, Number(familyId)),
                    eq(familyRoles.role, 'banker')
                ));
            if (Number(bankerCount[0]?.count || 0) >= 3) {
                return { success: false, error: 'Maximum of 3 bankers allowed per family' };
            }
        }

        if (role === 'admin') {
            if (actorLevel < ROLE_HIERARCHY['admin']) {
                return { success: false, error: 'Only admins or above can assign the admin role' };
            }
        }

        // Revoking admin requires owner
        const [existingTargetRole] = await db
            .select()
            .from(familyRoles)
            .where(and(
                eq(familyRoles.familyId, Number(familyId)),
                eq(familyRoles.userId, targetUserId)
            ))
            .limit(1);

        if (existingTargetRole) {
            const targetLevel = ROLE_HIERARCHY[existingTargetRole.role as FamilyRole] || 0;
            // Demoting admin requires owner
            if (targetLevel >= ROLE_HIERARCHY['admin'] && ROLE_HIERARCHY[role as FamilyRole] < ROLE_HIERARCHY['admin']) {
                if (actorRole.role !== 'owner') {
                    return { success: false, error: 'Only the owner can revoke admin privileges' };
                }
            }

            // Update existing role
            await db
                .update(familyRoles)
                .set({
                    role,
                    assignedBy: userId,
                    updatedAt: new Date(),
                })
                .where(eq(familyRoles.id, existingTargetRole.id));
        } else {
            // Create new role
            await db
                .insert(familyRoles)
                .values({
                    familyId: Number(familyId),
                    userId: targetUserId,
                    role,
                    assignedBy: userId,
                });
        }

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});
