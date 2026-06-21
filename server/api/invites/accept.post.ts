import { defineEventHandler, readBody } from 'h3';
import { db } from '../../db';
import { inviteLinks, claimRequests, familyMemberships, families } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../../utils/auth';

export default defineEventHandler(async (event) => {
    const { userId } = requireAuth(event);
    const { code } = await readBody(event);

    if (!code) {
        return { success: false, error: 'code is required' };
    }

    try {
        const [invite] = await db
            .select()
            .from(inviteLinks)
            .where(eq(inviteLinks.code, code))
            .limit(1);

        if (!invite) {
            return { success: false, error: 'Invalid invite code' };
        }

        if (!invite.isActive) {
            return { success: false, error: 'This invite link has been deactivated' };
        }

        if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
            return { success: false, error: 'This invite link has expired' };
        }

        if (invite.maxUses && invite.usesCount >= invite.maxUses) {
            return { success: false, error: 'This invite link has reached its maximum uses' };
        }

        // Check if user already has a membership in this family
        const [existingMembership] = await db
            .select()
            .from(familyMemberships)
            .where(and(
                eq(familyMemberships.userId, userId),
                eq(familyMemberships.familyId, invite.familyId),
                eq(familyMemberships.status, 'active')
            ))
            .limit(1);

        if (existingMembership) {
            return { success: false, error: 'You are already a member of this family' };
        }

        // Get family to check settings
        const [family] = await db
            .select()
            .from(families)
            .where(eq(families.id, invite.familyId))
            .limit(1);

        if (!family) {
            return { success: false, error: 'Family not found' };
        }

        if (invite.type === 'person' && invite.personId) {
            // Person-specific invite: create a claim request that still needs admin approval
            const settings = family.settings as any;
            const requiredApprovals = settings?.minAdminsForApproval || 1;

            await db
                .insert(claimRequests)
                .values({
                    type: 'claim_person',
                    requesterId: userId,
                    personId: invite.personId,
                    familyId: invite.familyId,
                    message: `Accepted invite link`,
                    requiredApprovals,
                });
        } else {
            // Family invite: create a claim request for joining
            const settings = family.settings as any;
            const requiredApprovals = settings?.minAdminsForApproval || 1;

            await db
                .insert(claimRequests)
                .values({
                    type: 'join_family',
                    requesterId: userId,
                    familyId: invite.familyId,
                    message: `Accepted invite link`,
                    requiredApprovals,
                });
        }

        // Increment uses count
        await db
            .update(inviteLinks)
            .set({ usesCount: invite.usesCount + 1 })
            .where(eq(inviteLinks.id, invite.id));

        return { success: true, familyId: invite.familyId };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});
