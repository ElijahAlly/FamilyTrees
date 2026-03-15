import { defineEventHandler, readBody } from 'h3';
import { db } from '../../db';
import { people, families, marriages, activityLogs } from '../../db/schema';
import { eq, sql, or, and } from 'drizzle-orm';
import { requireAuth } from '../../utils/auth';
import { getUserRoleInFamily, ROLE_HIERARCHY } from '../../utils/permissions';

export default defineEventHandler(async (event) => {
    const { userId } = requireAuth(event);
    const { personId, familyId } = await readBody(event);

    if (!personId || !familyId) {
        return { success: false, error: 'personId and familyId are required' };
    }

    // Only admins and owners can remove people
    const role = await getUserRoleInFamily(userId, Number(familyId));
    if (!role || ROLE_HIERARCHY[role] < ROLE_HIERARCHY['admin']) {
        return { success: false, error: 'Only admins and owners can remove people from the family' };
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

        // Remove person from family members array
        await db
            .update(families)
            .set({
                members: sql`array_remove(COALESCE(${families.members}, ARRAY[]::integer[]), ${Number(personId)})`,
            })
            .where(eq(families.id, Number(familyId)));

        // Clear parent references on children that point to this person
        await db
            .update(people)
            .set({ motherId: null, updatedBy: userId })
            .where(eq(people.motherId, Number(personId)));

        await db
            .update(people)
            .set({ fatherId: null, updatedBy: userId })
            .where(eq(people.fatherId, Number(personId)));

        // Remove marriage records involving this person
        await db
            .delete(marriages)
            .where(
                or(
                    eq(marriages.person1Id, Number(personId)),
                    eq(marriages.person2Id, Number(personId))
                )
            );

        // Delete activity logs that reference this person (FK constraint)
        await db
            .delete(activityLogs)
            .where(eq(activityLogs.personId, Number(personId)));

        // Delete the person record itself
        await db
            .delete(people)
            .where(eq(people.id, Number(personId)));

        // Log the removal activity — use the family creator or first remaining member as personId
        // since the removed person no longer exists
        const [family] = await db
            .select()
            .from(families)
            .where(eq(families.id, Number(familyId)))
            .limit(1);

        const logPersonId = family?.createdBy || 0;
        if (logPersonId) {
            await db
                .insert(activityLogs)
                .values({
                    personId: logPersonId,
                    familyId: Number(familyId),
                    actionType: 'REMOVED_PERSON',
                    performedBy: userId,
                    details: {
                        removedPerson: `${person.firstName} ${person.lastName}`,
                        removedPersonId: Number(personId),
                    },
                });
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error removing person from family:', error);
        return { success: false, error: error.message };
    }
});
