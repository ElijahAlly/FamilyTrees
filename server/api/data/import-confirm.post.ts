import { defineEventHandler, readBody } from 'h3';
import { db } from '../../db';
import { families, people, dataImports, activityLogs } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '../../utils/auth';
import { isAdminOrAbove } from '../../utils/permissions';

export default defineEventHandler(async (event) => {
    const { userId } = requireAuth(event);
    const { importId, familyId, reviewedPeople } = await readBody(event);

    if (!importId || !familyId || !reviewedPeople) {
        return { success: false, error: 'importId, familyId, and reviewedPeople are required' };
    }

    try {
        // Verify user is an admin
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
            return { success: false, error: 'Only admins can confirm imports' };
        }

        // Verify import record
        const [importRecord] = await db
            .select()
            .from(dataImports)
            .where(eq(dataImports.id, Number(importId)))
            .limit(1);

        if (!importRecord) {
            return { success: false, error: 'Import record not found' };
        }

        if (importRecord.status !== 'pending_review') {
            return { success: false, error: 'Import has already been processed' };
        }

        // Insert people records from reviewed data
        const createdPeople: any[] = [];

        for (const person of reviewedPeople) {
            if (!person.firstName || !person.lastName) continue;

            const [created] = await db
                .insert(people)
                .values({
                    firstName: person.firstName,
                    lastName: person.lastName,
                    middleName: person.middleName || null,
                    birthDate: person.birthDate || null,
                    deathDate: person.deathDate || null,
                    gender: person.gender || null,
                    isLiving: person.isLiving !== undefined ? person.isLiving : true,
                    createdBy: userId,
                })
                .returning();

            createdPeople.push(created);
        }

        // Update the family members array with the new person IDs
        const currentMembers = (family.members || []).filter((id): id is number => id !== null);
        const newMemberIds = createdPeople.map(p => p.id);
        const updatedMembers = [...currentMembers, ...newMemberIds];

        await db
            .update(families)
            .set({ members: updatedMembers })
            .where(eq(families.id, Number(familyId)));

        // Update import record
        const summary = {
            peopleAdded: createdPeople.length,
            peopleSkipped: reviewedPeople.length - createdPeople.length,
        };

        await db
            .update(dataImports)
            .set({
                status: 'confirmed',
                reviewedData: { people: reviewedPeople },
                importSummary: summary,
                confirmedAt: new Date(),
            })
            .where(eq(dataImports.id, Number(importId)));

        // Log a single activity entry for the import
        if (createdPeople.length > 0) {
            await db
                .insert(activityLogs)
                .values({
                    personId: createdPeople[0].id,
                    familyId: Number(familyId),
                    actionType: 'DATA_IMPORTED',
                    details: {
                        source: importRecord.source,
                        peopleAdded: createdPeople.length,
                        importId: importRecord.id,
                    },
                });
        }

        return {
            success: true,
            data: {
                ...summary,
                createdPeople,
            },
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});
