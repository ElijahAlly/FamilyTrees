import { defineEventHandler, readBody } from 'h3';
import { db } from '../../db';
import { families, mergeRequests, people, familyMemberships } from '../../db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { requireAuth } from '../../utils/auth';

// Detect conflicts between two families' members
function detectConflicts(sourcePeople: any[], targetPeople: any[]): any[] {
    const conflicts: any[] = [];

    for (const sp of sourcePeople) {
        // Try to find matching person in target by name
        const match = targetPeople.find(tp =>
            tp.firstName?.toLowerCase() === sp.firstName?.toLowerCase() &&
            tp.lastName?.toLowerCase() === sp.lastName?.toLowerCase()
        );

        if (match) {
            const personConflicts: any = {
                sourcePersonId: sp.id,
                targetPersonId: match.id,
                personName: `${sp.firstName} ${sp.lastName}`,
                fields: [],
            };

            // Check each field for conflicts
            const fieldsToCheck = ['middleName', 'birthDate', 'deathDate', 'gender', 'isLiving'];
            for (const field of fieldsToCheck) {
                if (sp[field] !== null && match[field] !== null && sp[field] !== match[field]) {
                    personConflicts.fields.push({
                        field,
                        sourceValue: sp[field],
                        targetValue: match[field],
                        resolution: null, // To be resolved during review
                    });
                }
            }

            if (personConflicts.fields.length > 0) {
                conflicts.push(personConflicts);
            }
        }
    }

    return conflicts;
}

export default defineEventHandler(async (event) => {
    const { userId } = requireAuth(event);
    const { sourceFamilyId, targetFamilyId, mergeNotes } = await readBody(event);

    if (!sourceFamilyId || !targetFamilyId) {
        return { success: false, error: 'sourceFamilyId and targetFamilyId are required' };
    }

    if (Number(sourceFamilyId) === Number(targetFamilyId)) {
        return { success: false, error: 'Cannot merge a family with itself' };
    }

    try {
        // Verify both families exist
        const [sourceFamily] = await db
            .select()
            .from(families)
            .where(eq(families.id, Number(sourceFamilyId)))
            .limit(1);

        const [targetFamily] = await db
            .select()
            .from(families)
            .where(eq(families.id, Number(targetFamilyId)))
            .limit(1);

        if (!sourceFamily || !targetFamily) {
            return { success: false, error: 'One or both families not found' };
        }

        // User must be admin of at least the source family
        const sourceAdmins = (sourceFamily.admins || []) as string[];
        if (!sourceAdmins.includes(userId)) {
            return { success: false, error: 'You must be an admin of the source family to request a merge' };
        }

        // Get people from both families
        const sourceMemberIds = (sourceFamily.members || []).filter((id): id is number => id !== null);
        const targetMemberIds = (targetFamily.members || []).filter((id): id is number => id !== null);

        let sourcePeople: any[] = [];
        let targetPeople: any[] = [];

        if (sourceMemberIds.length > 0) {
            sourcePeople = await db.select().from(people).where(inArray(people.id, sourceMemberIds));
        }
        if (targetMemberIds.length > 0) {
            targetPeople = await db.select().from(people).where(inArray(people.id, targetMemberIds));
        }

        // Detect conflicts
        const conflicts = detectConflicts(sourcePeople, targetPeople);

        const [request] = await db
            .insert(mergeRequests)
            .values({
                sourceFamilyId: Number(sourceFamilyId),
                targetFamilyId: Number(targetFamilyId),
                requestedBy: userId,
                conflicts,
                mergeNotes: mergeNotes || null,
            })
            .returning();

        return {
            success: true,
            data: {
                ...request,
                sourceFamilyName: sourceFamily.familyName,
                targetFamilyName: targetFamily.familyName,
                conflictCount: conflicts.length,
            },
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});
