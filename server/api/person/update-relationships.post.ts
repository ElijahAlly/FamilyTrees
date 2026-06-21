import { defineEventHandler, readBody } from 'h3';
import { db } from '../../db';
import { people, marriages, activityLogs } from '../../db/schema';
import { eq, or, and } from 'drizzle-orm';
import { requireAuth } from '../../utils/auth';
import { getUserRoleInFamily, ROLE_HIERARCHY } from '../../utils/permissions';

export default defineEventHandler(async (event) => {
    const { userId } = requireAuth(event);
    const body = await readBody(event);
    const { personId, familyId, motherId, fatherId, setMotherForSiblings, setFatherForSiblings } = body;

    if (!personId || !familyId) {
        return { success: false, error: 'personId and familyId are required' };
    }

    // Must be at least a member
    const role = await getUserRoleInFamily(userId, Number(familyId));
    if (!role) {
        return { success: false, error: 'You do not have permission to edit relationships in this family' };
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

        const updates: Record<string, any> = { updatedBy: userId };

        if (motherId !== undefined) {
            updates.motherId = motherId ? Number(motherId) : null;
        }
        if (fatherId !== undefined) {
            updates.fatherId = fatherId ? Number(fatherId) : null;
        }

        const [updated] = await db
            .update(people)
            .set(updates)
            .where(eq(people.id, Number(personId)))
            .returning();

        // Optionally set the same mother/father for siblings
        // (siblings = other people with the same existing fatherId or motherId)
        if (setMotherForSiblings && motherId && person.fatherId) {
            // Find siblings (same father, missing mother)
            const siblings = await db
                .select()
                .from(people)
                .where(
                    and(
                        eq(people.fatherId, person.fatherId),
                    )
                );

            for (const sibling of siblings) {
                if (sibling.id !== Number(personId) && !sibling.motherId) {
                    await db
                        .update(people)
                        .set({ motherId: Number(motherId), updatedBy: userId })
                        .where(eq(people.id, sibling.id));
                }
            }
        }

        if (setFatherForSiblings && fatherId && person.motherId) {
            const siblings = await db
                .select()
                .from(people)
                .where(
                    and(
                        eq(people.motherId, person.motherId),
                    )
                );

            for (const sibling of siblings) {
                if (sibling.id !== Number(personId) && !sibling.fatherId) {
                    await db
                        .update(people)
                        .set({ fatherId: Number(fatherId), updatedBy: userId })
                        .where(eq(people.id, sibling.id));
                }
            }
        }

        // Log activity
        await db
            .insert(activityLogs)
            .values({
                personId: Number(personId),
                familyId: Number(familyId),
                actionType: 'UPDATED_RELATIONSHIPS',
                performedBy: userId,
                details: {
                    updatedPerson: `${person.firstName} ${person.lastName}`,
                    changes: { motherId, fatherId },
                },
            });

        return { success: true, data: updated };
    } catch (error: any) {
        console.error('Error updating relationships:', error);
        return { success: false, error: error.message };
    }
});
