import { defineEventHandler, readBody } from 'h3';
import { db } from '../../db';
import { claimRequests, families, people, authUsers } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../../utils/auth';

export default defineEventHandler(async (event) => {
    const { userId } = requireAuth(event);
    const requesterId = userId;
    const { type, personId, familyId, message, authProvider } = await readBody(event);

    if (!type) {
        return { success: false, error: 'type is required' };
    }

    if (type === 'claim_person' && !personId) {
        return { success: false, error: 'personId is required for claim_person requests' };
    }

    if ((type === 'join_family' || type === 'add_self_to_family') && !familyId) {
        return { success: false, error: 'familyId is required for family join requests' };
    }

    try {
        // Verify the requester exists
        const [requester] = await db
            .select()
            .from(authUsers)
            .where(eq(authUsers.id, requesterId))
            .limit(1);

        if (!requester) {
            return { success: false, error: 'Requester not found' };
        }

        // For claim_person: check the person exists and isn't already claimed
        if (type === 'claim_person' && personId) {
            const [person] = await db
                .select()
                .from(people)
                .where(eq(people.id, personId))
                .limit(1);

            if (!person) {
                return { success: false, error: 'Person not found' };
            }

            if (person.claimedBy) {
                return { success: false, error: 'This person has already been claimed' };
            }

            // Check for existing pending claim on this person by this user
            const [existingClaim] = await db
                .select()
                .from(claimRequests)
                .where(and(
                    eq(claimRequests.requesterId, requesterId),
                    eq(claimRequests.personId, personId),
                    eq(claimRequests.status, 'pending')
                ))
                .limit(1);

            if (existingClaim) {
                return { success: false, error: 'You already have a pending claim for this person' };
            }
        }

        // For family requests: check the family exists and get its settings
        let requiredApprovals = 1;
        if (familyId) {
            const [family] = await db
                .select()
                .from(families)
                .where(eq(families.id, familyId))
                .limit(1);

            if (!family) {
                return { success: false, error: 'Family not found' };
            }

            const settings = family.settings as any;
            requiredApprovals = settings?.minAdminsForApproval || 1;

            // Check for existing pending request for this family by this user
            const [existingRequest] = await db
                .select()
                .from(claimRequests)
                .where(and(
                    eq(claimRequests.requesterId, requesterId),
                    eq(claimRequests.familyId, familyId),
                    eq(claimRequests.status, 'pending')
                ))
                .limit(1);

            if (existingRequest) {
                return { success: false, error: 'You already have a pending request for this family' };
            }
        }

        const [newRequest] = await db
            .insert(claimRequests)
            .values({
                type,
                requesterId,
                personId: personId || null,
                familyId: familyId || null,
                message: message || null,
                authProvider: authProvider || null,
                requiredApprovals,
            })
            .returning();

        return { success: true, data: newRequest };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});
