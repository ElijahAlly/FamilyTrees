import { defineEventHandler, readBody } from 'h3';
import { db } from '../../db';
import { claimRequests, familyMemberships, familyRoles, people } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../../utils/auth';
import { isAdminOrAbove } from '../../utils/permissions';

export default defineEventHandler(async (event) => {
    const { userId } = requireAuth(event);
    const reviewerId = userId;
    const { claimId, action, reviewNotes } = await readBody(event);

    if (!claimId || !action) {
        return { success: false, error: 'claimId and action are required' };
    }

    if (!['approve', 'deny'].includes(action)) {
        return { success: false, error: 'action must be "approve" or "deny"' };
    }

    try {
        // Get the claim request
        const [claim] = await db
            .select()
            .from(claimRequests)
            .where(eq(claimRequests.id, Number(claimId)))
            .limit(1);

        if (!claim) {
            return { success: false, error: 'Claim request not found' };
        }

        if (claim.status !== 'pending') {
            return { success: false, error: 'This claim has already been resolved' };
        }

        // Verify reviewer is an admin of the family
        if (claim.familyId) {
            const hasPermission = await isAdminOrAbove(reviewerId, claim.familyId);
            if (!hasPermission) {
                return { success: false, error: 'You are not an admin of this family' };
            }
        }

        // Check if this reviewer already reviewed
        const alreadyReviewed = (claim.reviewedBy || []).includes(reviewerId);
        if (alreadyReviewed) {
            return { success: false, error: 'You have already reviewed this claim' };
        }

        if (action === 'deny') {
            // Denial by any admin immediately denies the request
            await db
                .update(claimRequests)
                .set({
                    status: 'denied',
                    reviewNotes: reviewNotes || null,
                    reviewedBy: [...(claim.reviewedBy || []), reviewerId],
                    resolvedAt: new Date(),
                })
                .where(eq(claimRequests.id, Number(claimId)));

            return { success: true, status: 'denied' };
        }

        // Approve flow
        const newApprovals = claim.currentApprovals + 1;
        const newReviewedBy = [...(claim.reviewedBy || []), reviewerId];

        if (newApprovals >= claim.requiredApprovals) {
            // Fully approved - execute the claim
            await db
                .update(claimRequests)
                .set({
                    status: 'approved',
                    currentApprovals: newApprovals,
                    reviewedBy: newReviewedBy,
                    reviewNotes: reviewNotes || null,
                    resolvedAt: new Date(),
                })
                .where(eq(claimRequests.id, Number(claimId)));

            // Execute the actual claim action
            if (claim.type === 'claim_person' && claim.personId) {
                // Set claimedBy on the person record
                await db
                    .update(people)
                    .set({
                        claimedBy: claim.requesterId,
                        userId: claim.requesterId,
                    })
                    .where(eq(people.id, claim.personId));

                // Also create a family membership if familyId is set
                if (claim.familyId) {
                    await db
                        .insert(familyMemberships)
                        .values({
                            userId: claim.requesterId,
                            familyId: claim.familyId,
                            personId: claim.personId,
                            kind: 'relatives',
                            status: 'active',
                        });
                }
            } else if (claim.type === 'join_family' && claim.familyId) {
                // Create membership
                await db
                    .insert(familyMemberships)
                    .values({
                        userId: claim.requesterId,
                        familyId: claim.familyId,
                        kind: 'relatives',
                        status: 'active',
                    });
            } else if (claim.type === 'add_self_to_family' && claim.familyId) {
                // Create membership and link person
                await db
                    .insert(familyMemberships)
                    .values({
                        userId: claim.requesterId,
                        familyId: claim.familyId,
                        personId: claim.personId || null,
                        kind: 'relatives',
                        status: 'active',
                    });
            }

            // Create member role for the approved user
            if (claim.familyId) {
                // Check if role already exists
                const [existingRole] = await db
                    .select()
                    .from(familyRoles)
                    .where(and(
                        eq(familyRoles.familyId, claim.familyId),
                        eq(familyRoles.userId, claim.requesterId)
                    ))
                    .limit(1);

                if (!existingRole) {
                    await db
                        .insert(familyRoles)
                        .values({
                            familyId: claim.familyId,
                            userId: claim.requesterId,
                            role: 'member',
                            assignedBy: reviewerId,
                        });
                }
            }

            return { success: true, status: 'approved' };
        } else {
            // Partially approved - needs more admin approvals
            await db
                .update(claimRequests)
                .set({
                    currentApprovals: newApprovals,
                    reviewedBy: newReviewedBy,
                    reviewNotes: reviewNotes || null,
                })
                .where(eq(claimRequests.id, Number(claimId)));

            return {
                success: true,
                status: 'partial',
                currentApprovals: newApprovals,
                requiredApprovals: claim.requiredApprovals,
            };
        }
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});
