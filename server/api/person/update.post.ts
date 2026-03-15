import { defineEventHandler, readBody } from 'h3';
import { db } from '../../db';
import { people, families, activityLogs } from '../../db/schema';
import { eq, sql } from 'drizzle-orm';
import { requireAuth } from '../../utils/auth';
import { getUserRoleInFamily, ROLE_HIERARCHY } from '../../utils/permissions';

export default defineEventHandler(async (event) => {
    const { userId } = requireAuth(event);
    const body = await readBody(event);
    const { personId, familyId, firstName, middleName, lastName, birthDate, deathDate, gender, isLiving, extendedInfo } = body;

    if (!personId) {
        return { success: false, error: 'personId is required' };
    }

    try {
        const [person] = await db
            .select()
            .from(people)
            .where(eq(people.id, Number(personId)))
            .limit(1);

        if (!person) {
            return { success: false, error: 'Person not found' };
        }

        // Check permissions: must be the claimed user, or an admin/owner of a family the person belongs to
        const isSelf = person.claimedBy === userId || person.userId === userId;
        let isAuthorized = isSelf;

        if (!isAuthorized && familyId) {
            const role = await getUserRoleInFamily(userId, Number(familyId));
            if (role && ROLE_HIERARCHY[role] >= ROLE_HIERARCHY['admin']) {
                isAuthorized = true;
            }
        }

        if (!isAuthorized) {
            return { success: false, error: 'You do not have permission to edit this person' };
        }

        // Build the update object with only provided fields
        const updates: Record<string, any> = { updatedBy: userId };

        if (firstName !== undefined) updates.firstName = firstName;
        if (middleName !== undefined) updates.middleName = middleName || null;
        if (lastName !== undefined) updates.lastName = lastName;
        if (birthDate !== undefined) updates.birthDate = birthDate || null;
        if (deathDate !== undefined) updates.deathDate = deathDate || null;
        if (gender !== undefined) updates.gender = gender;
        if (isLiving !== undefined) updates.isLiving = isLiving;
        if (body.motherId !== undefined) updates.motherId = body.motherId || null;
        if (body.fatherId !== undefined) updates.fatherId = body.fatherId || null;

        if (extendedInfo !== undefined) {
            const currentExtended = (person.extendedInfo || {}) as Record<string, any>;
            updates.extendedInfo = { ...currentExtended, ...extendedInfo };
        }

        // Track what changed for the audit log
        const changes: Record<string, { from: any; to: any }> = {};
        const trackFields = ['firstName', 'lastName', 'middleName', 'birthDate', 'deathDate', 'gender', 'isLiving'] as const;
        for (const field of trackFields) {
            if (updates[field] !== undefined && updates[field] !== (person as any)[field]) {
                changes[field] = { from: (person as any)[field], to: updates[field] };
            }
        }

        const [updated] = await db
            .update(people)
            .set(updates)
            .where(eq(people.id, Number(personId)))
            .returning();

        // Log to audit trail if familyId provided and there were meaningful changes
        if (familyId && Object.keys(changes).length > 0) {
            try {
                await db.insert(activityLogs).values({
                    personId: Number(personId),
                    familyId: Number(familyId),
                    actionType: 'PERSON_UPDATED',
                    performedBy: userId,
                    details: {
                        updatedPerson: `${person.firstName} ${person.lastName}`,
                        changes,
                    },
                });
            } catch {
                // Don't fail the update if logging fails
            }
        }

        return { success: true, data: updated };
    } catch (error: any) {
        console.error('Error updating person:', error);
        return { success: false, error: error.message };
    }
});
