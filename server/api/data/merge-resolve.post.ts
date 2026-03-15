import { defineEventHandler, readBody } from 'h3';
import { db } from '../../db';
import { families, mergeRequests, people, familyMemberships, activityLogs } from '../../db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { requireAuth } from '../../utils/auth';

export default defineEventHandler(async (event) => {
    const { userId } = requireAuth(event);
    const { mergeRequestId, action, resolutions } = await readBody(event);

    if (!mergeRequestId || !action) {
        return { success: false, error: 'mergeRequestId and action are required' };
    }

    if (!['approve', 'reject'].includes(action)) {
        return { success: false, error: 'action must be approve or reject' };
    }

    try {
        const [request] = await db
            .select()
            .from(mergeRequests)
            .where(eq(mergeRequests.id, Number(mergeRequestId)))
            .limit(1);

        if (!request) {
            return { success: false, error: 'Merge request not found' };
        }

        if (request.status !== 'pending') {
            return { success: false, error: 'Merge request has already been processed' };
        }

        // Verify user is admin of the target family
        const [targetFamily] = await db
            .select()
            .from(families)
            .where(eq(families.id, request.targetFamilyId))
            .limit(1);

        if (!targetFamily) {
            return { success: false, error: 'Target family not found' };
        }

        const targetAdmins = (targetFamily.admins || []) as string[];
        if (!targetAdmins.includes(userId)) {
            return { success: false, error: 'You must be an admin of the target family to review merge requests' };
        }

        if (action === 'reject') {
            await db
                .update(mergeRequests)
                .set({ status: 'rejected', reviewedBy: [...(request.reviewedBy as string[]), userId] })
                .where(eq(mergeRequests.id, Number(mergeRequestId)));

            return { success: true, data: { status: 'rejected' } };
        }

        // action === 'approve' — execute the merge

        const [sourceFamily] = await db
            .select()
            .from(families)
            .where(eq(families.id, request.sourceFamilyId))
            .limit(1);

        if (!sourceFamily) {
            return { success: false, error: 'Source family not found' };
        }

        // Apply conflict resolutions
        const conflicts = (request.conflicts || []) as any[];
        if (resolutions && conflicts.length > 0) {
            for (const conflict of conflicts) {
                const resolution = resolutions[`${conflict.sourcePersonId}-${conflict.targetPersonId}`];
                if (!resolution) continue;

                for (const fieldConflict of conflict.fields) {
                    const chosenValue = resolution[fieldConflict.field];
                    if (chosenValue === undefined) continue;

                    // Update the target person with the chosen value
                    await db
                        .update(people)
                        .set({ [fieldConflict.field]: chosenValue })
                        .where(eq(people.id, conflict.targetPersonId));
                }
            }
        }

        // Move non-duplicate members from source to target
        const sourceMemberIds = (sourceFamily.members || []).filter((id): id is number => id !== null);
        const targetMemberIds = (targetFamily.members || []).filter((id): id is number => id !== null);

        // Get source people to check for duplicates
        let sourcePeople: any[] = [];
        let targetPeople: any[] = [];

        if (sourceMemberIds.length > 0) {
            sourcePeople = await db.select().from(people).where(inArray(people.id, sourceMemberIds));
        }
        if (targetMemberIds.length > 0) {
            targetPeople = await db.select().from(people).where(inArray(people.id, targetMemberIds));
        }

        // Find which source people are NOT duplicates (no name match in target)
        const nonDuplicateSourcePeople = sourcePeople.filter(sp => {
            return !targetPeople.some(tp =>
                tp.firstName?.toLowerCase() === sp.firstName?.toLowerCase() &&
                tp.lastName?.toLowerCase() === sp.lastName?.toLowerCase()
            );
        });

        // Add non-duplicate people to target family
        const newMemberIds = nonDuplicateSourcePeople.map(p => p.id);
        const updatedTargetMembers = [...targetMemberIds, ...newMemberIds];

        await db
            .update(families)
            .set({ members: updatedTargetMembers })
            .where(eq(families.id, request.targetFamilyId));

        // Move memberships from source to target
        const sourceMemberships = await db
            .select()
            .from(familyMemberships)
            .where(and(
                eq(familyMemberships.familyId, request.sourceFamilyId),
                eq(familyMemberships.status, 'active')
            ));

        for (const m of sourceMemberships) {
            // Check if user already has membership in target
            const [existing] = await db
                .select()
                .from(familyMemberships)
                .where(and(
                    eq(familyMemberships.familyId, request.targetFamilyId),
                    eq(familyMemberships.userId, m.userId),
                    eq(familyMemberships.status, 'active')
                ))
                .limit(1);

            if (!existing) {
                await db.insert(familyMemberships).values({
                    userId: m.userId,
                    familyId: request.targetFamilyId,
                    personId: m.personId,
                    kind: m.kind,
                    status: 'active',
                });
            }

            // Mark source membership as removed
            await db
                .update(familyMemberships)
                .set({ status: 'removed', removedAt: new Date() })
                .where(eq(familyMemberships.id, m.id));
        }

        // Archive the source family
        await db
            .update(families)
            .set({ archivedAt: new Date() })
            .where(eq(families.id, request.sourceFamilyId));

        // Update merge request
        await db
            .update(mergeRequests)
            .set({
                status: 'completed',
                reviewedBy: [...(request.reviewedBy as string[]), userId],
                resolutions: resolutions || {},
                completedAt: new Date(),
            })
            .where(eq(mergeRequests.id, Number(mergeRequestId)));

        // Log activity
        if (nonDuplicateSourcePeople.length > 0 || targetPeople.length > 0) {
            const logPersonId = targetPeople[0]?.id || nonDuplicateSourcePeople[0]?.id;
            if (logPersonId) {
                await db.insert(activityLogs).values({
                    personId: logPersonId,
                    familyId: request.targetFamilyId,
                    actionType: 'MERGE_COMPLETED',
                    details: {
                        sourceFamilyId: request.sourceFamilyId,
                        sourceFamilyName: sourceFamily.familyName,
                        peopleMoved: nonDuplicateSourcePeople.length,
                        conflictsResolved: conflicts.length,
                    },
                });
            }
        }

        return {
            success: true,
            data: {
                status: 'completed',
                peopleMoved: nonDuplicateSourcePeople.length,
                conflictsResolved: conflicts.length,
                sourceArchived: true,
            },
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});
