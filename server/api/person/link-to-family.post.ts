import { defineEventHandler, readBody } from 'h3';
import { db } from '../../db';
import { people, families, marriages, activityLogs } from '../../db/schema';
import { eq, sql } from 'drizzle-orm';
import { requireAuth } from '../../utils/auth';
import { getUserRoleInFamily } from '../../utils/permissions';

export default defineEventHandler(async (event) => {
    const { userId } = requireAuth(event);
    const {
        personId,
        familyId,
        relationship,
        relativePersonId,
    } = await readBody(event);

    if (!personId || !familyId) {
        return { success: false, error: 'personId and familyId are required' };
    }

    // Verify user has at least 'member' role in the family
    const role = await getUserRoleInFamily(userId, Number(familyId));
    if (!role) {
        return { success: false, error: 'You do not have permission to add people to this family' };
    }

    try {
        // Verify the person exists
        const [person] = await db
            .select()
            .from(people)
            .where(eq(people.id, Number(personId)))
            .limit(1);

        if (!person) {
            return { success: false, error: 'Person not found' };
        }

        // Check if already in family
        const [family] = await db
            .select()
            .from(families)
            .where(eq(families.id, Number(familyId)))
            .limit(1);

        if (!family) {
            return { success: false, error: 'Family not found' };
        }

        const members = family.members || [];
        if (members.includes(Number(personId))) {
            return { success: false, error: 'Person is already a member of this family' };
        }

        // Add person to family members array
        await db
            .update(families)
            .set({
                members: sql`array_append(COALESCE(${families.members}, ARRAY[]::integer[]), ${Number(personId)})`,
            })
            .where(eq(families.id, Number(familyId)));

        // Handle relationship-specific logic
        if (relationship === 'spouse' && relativePersonId) {
            await db.insert(marriages).values({
                person1Id: Number(relativePersonId),
                person2Id: Number(personId),
                createdBy: userId,
            });
        } else if (relationship === 'parent' && relativePersonId) {
            const updateField = person.gender === 'F'
                ? { motherId: Number(personId) }
                : { fatherId: Number(personId) };
            await db
                .update(people)
                .set({ ...updateField, updatedBy: userId })
                .where(eq(people.id, Number(relativePersonId)));
        } else if (relationship === 'child' && relativePersonId) {
            // Get the relative to determine which parent field to set
            const [relative] = await db
                .select()
                .from(people)
                .where(eq(people.id, Number(relativePersonId)))
                .limit(1);

            if (relative) {
                const updateField = relative.gender === 'F'
                    ? { motherId: Number(relativePersonId) }
                    : { fatherId: Number(relativePersonId) };
                await db
                    .update(people)
                    .set({ ...updateField, updatedBy: userId })
                    .where(eq(people.id, Number(personId)));
            }
        }

        // Log the activity
        await db
            .insert(activityLogs)
            .values({
                personId: Number(personId),
                familyId: Number(familyId),
                actionType: 'ADDED_PERSON',
                performedBy: userId,
                details: {
                    linkedExisting: true,
                    addedPerson: `${person.firstName} ${person.lastName}`,
                    relationship: relationship || 'none',
                    relativePersonId: relativePersonId || null,
                },
            });

        return { success: true, data: person };
    } catch (error: any) {
        console.error('Error linking person to family:', error);
        return { success: false, error: error.message };
    }
});
