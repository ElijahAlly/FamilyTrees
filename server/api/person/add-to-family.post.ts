import { defineEventHandler, readBody } from 'h3';
import { db } from '../../db';
import { people, families, marriages, activityLogs } from '../../db/schema';
import { eq, sql } from 'drizzle-orm';
import { requireAuth } from '../../utils/auth';
import { getUserRoleInFamily } from '../../utils/permissions';

export default defineEventHandler(async (event) => {
    const { userId } = requireAuth(event);
    const {
        firstName,
        lastName,
        middleName,
        birthDate,
        deathDate,
        gender,
        isLiving,
        motherId,
        fatherId,
        familyId,
        reason,
        relationship,
        relativePersonId,
    } = await readBody(event);

    if (!firstName || !lastName || !familyId) {
        return { success: false, error: 'firstName, lastName, and familyId are required' };
    }

    // Verify user has at least 'member' role in the family
    const role = await getUserRoleInFamily(userId, Number(familyId));
    if (!role) {
        return { success: false, error: 'You do not have permission to add people to this family' };
    }

    try {
        // Create the person
        const [newPerson] = await db
            .insert(people)
            .values({
                firstName,
                lastName,
                middleName: middleName || null,
                birthDate: birthDate || null,
                deathDate: isLiving !== false ? null : deathDate || null,
                gender: gender || 'U',
                isLiving: isLiving !== undefined ? isLiving : true,
                motherId: motherId || null,
                fatherId: fatherId || null,
                createdBy: userId,
                updatedBy: userId,
            })
            .returning();

        if (!newPerson) {
            return { success: false, error: 'Failed to create person' };
        }

        // Add person to family members array
        await db
            .update(families)
            .set({
                members: sql`array_append(COALESCE(${families.members}, ARRAY[]::integer[]), ${newPerson.id})`,
            })
            .where(eq(families.id, Number(familyId)));

        // Handle relationship-specific logic
        if (relationship === 'spouse' && relativePersonId) {
            // Create a marriage record between the new person and the relative
            await db.insert(marriages).values({
                person1Id: relativePersonId,
                person2Id: newPerson.id,
                createdBy: userId,
            });
        } else if (relationship === 'parent' && relativePersonId) {
            // Set the relative person's motherId or fatherId to the new person
            const updateField = gender === 'F'
                ? { motherId: newPerson.id }
                : { fatherId: newPerson.id };
            await db
                .update(people)
                .set({ ...updateField, updatedBy: userId })
                .where(eq(people.id, relativePersonId));
        }
        // For 'sibling', motherId/fatherId are already set from the frontend
        // For 'child', motherId/fatherId are already set from the frontend

        // Log the activity
        await db
            .insert(activityLogs)
            .values({
                personId: newPerson.id,
                familyId: Number(familyId),
                actionType: 'ADDED_PERSON',
                performedBy: userId,
                reason: reason || null,
                details: {
                    addedPerson: `${firstName} ${lastName}`,
                    relationship: relationship || 'none',
                    relativePersonId: relativePersonId || null,
                    parentIds: {
                        motherId: motherId || null,
                        fatherId: fatherId || null,
                    },
                },
            });

        return { success: true, data: newPerson };
    } catch (error: any) {
        console.error('Error adding person to family:', error);
        return { success: false, error: error.message };
    }
});
