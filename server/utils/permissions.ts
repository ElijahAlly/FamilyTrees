import { db } from '../db';
import { familyRoles, people } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import type { FamilyRole } from '../../types/roles';

export const ROLE_HIERARCHY: Record<FamilyRole, number> = {
    owner: 5,
    banker: 4,
    admin: 3,
    member: 2,
    guest: 1,
};

/**
 * Get a user's role in a specific family.
 */
export async function getUserRoleInFamily(userId: string, familyId: number): Promise<FamilyRole | null> {
    const [role] = await db
        .select({ role: familyRoles.role })
        .from(familyRoles)
        .where(and(
            eq(familyRoles.userId, userId),
            eq(familyRoles.familyId, familyId)
        ))
        .limit(1);

    return role?.role || null;
}

/**
 * Check if a user is the owner of a family.
 */
export async function isOwner(userId: string, familyId: number): Promise<boolean> {
    const role = await getUserRoleInFamily(userId, familyId);
    return role === 'owner';
}

/**
 * Check if a user has admin-level or above permissions.
 */
export async function isAdminOrAbove(userId: string, familyId: number): Promise<boolean> {
    const role = await getUserRoleInFamily(userId, familyId);
    if (!role) return false;
    return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY['admin'];
}

function getAgeLabel(birthDate: string | null): 'child' | 'teenager' | 'adult' | null {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    if (age < 13) return 'child';
    if (age < 18) return 'teenager';
    return 'adult';
}

/**
 * Check if user can manage (upload/remove) photos for a target person.
 *
 * Returns: { allowed: boolean, requiresApproval: boolean }
 */
export async function canManagePhotosFor(
    actorUserId: string,
    targetPersonId: number,
    familyId: number
): Promise<{ allowed: boolean; requiresApproval: boolean }> {
    const actorRole = await getUserRoleInFamily(actorUserId, familyId);
    if (!actorRole || actorRole === 'guest') {
        return { allowed: false, requiresApproval: false };
    }

    // Admin or above can always manage photos
    if (ROLE_HIERARCHY[actorRole] >= ROLE_HIERARCHY['admin']) {
        return { allowed: true, requiresApproval: false };
    }

    // Get actor's person record
    const [actorPerson] = await db
        .select()
        .from(people)
        .where(eq(people.userId, actorUserId))
        .limit(1);

    if (!actorPerson) {
        return { allowed: false, requiresApproval: false };
    }

    // Get target person record
    const [targetPerson] = await db
        .select()
        .from(people)
        .where(eq(people.id, targetPersonId))
        .limit(1);

    if (!targetPerson) {
        return { allowed: false, requiresApproval: false };
    }

    const actorAge = getAgeLabel(actorPerson.birthDate);
    const targetAge = getAgeLabel(targetPerson.birthDate);

    // Children cannot manage any photos
    if (actorAge === 'child') {
        return { allowed: false, requiresApproval: false };
    }

    // Self-management
    const isSelf = targetPerson.claimedBy === actorUserId || targetPerson.userId === actorUserId;
    if (isSelf) {
        if (actorAge === 'adult' || actorAge === null) {
            return { allowed: true, requiresApproval: false };
        }
        if (actorAge === 'teenager') {
            return { allowed: true, requiresApproval: true };
        }
    }

    // Parent managing child/teenager photos
    const isParent = targetPerson.motherId === actorPerson.id || targetPerson.fatherId === actorPerson.id;
    if (isParent) {
        if (targetAge === 'child' || targetAge === 'teenager') {
            return { allowed: true, requiresApproval: false };
        }
    }

    return { allowed: false, requiresApproval: false };
}
