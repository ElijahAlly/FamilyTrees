import { defineEventHandler, readBody } from 'h3';
import { db } from '../../db';
import { familyRoles, families } from '../../db/schema';
import { eq, and, sql } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
    const { familyId, voterId, newOwnerId } = await readBody(event);

    if (!familyId || !voterId) {
        return { success: false, error: 'familyId and voterId are required' };
    }

    try {
        // Get voter's role
        const [voterRole] = await db
            .select()
            .from(familyRoles)
            .where(and(
                eq(familyRoles.familyId, Number(familyId)),
                eq(familyRoles.userId, voterId)
            ))
            .limit(1);

        if (!voterRole || voterRole.role === 'guest') {
            return { success: false, error: 'You must be a member to vote' };
        }

        // Cannot vote if you're the owner
        if (voterRole.role === 'owner') {
            return { success: false, error: 'The owner cannot vote to remove themselves. Use transfer-ownership instead.' };
        }

        // Get family to read/update settings with votes
        const [family] = await db
            .select()
            .from(families)
            .where(eq(families.id, Number(familyId)))
            .limit(1);

        if (!family) {
            return { success: false, error: 'Family not found' };
        }

        const settings = (family.settings || {}) as Record<string, any>;
        const ownerRemovalVotes = settings.ownerRemovalVotes || {
            votes: [],
            newOwnerId: null,
            startedAt: null,
        };

        // Check if voter already voted
        const alreadyVoted = ownerRemovalVotes.votes.some(
            (v: any) => v.userId === voterId
        );
        if (alreadyVoted) {
            return { success: false, error: 'You have already voted' };
        }

        // Check vote age (expire votes older than 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        ownerRemovalVotes.votes = ownerRemovalVotes.votes.filter(
            (v: any) => new Date(v.votedAt) > thirtyDaysAgo
        );

        // Add vote
        ownerRemovalVotes.votes.push({
            userId: voterId,
            role: voterRole.role,
            votedAt: new Date().toISOString(),
        });

        if (newOwnerId) {
            ownerRemovalVotes.newOwnerId = newOwnerId;
        }

        if (!ownerRemovalVotes.startedAt) {
            ownerRemovalVotes.startedAt = new Date().toISOString();
        }

        // Count votes by role
        const adminVotes = ownerRemovalVotes.votes.filter(
            (v: any) => v.role === 'admin' || v.role === 'banker'
        ).length;
        const totalVotes = ownerRemovalVotes.votes.length;

        // Check thresholds: 3+ admins OR 9+ members
        const thresholdMet = adminVotes >= 3 || totalVotes >= 9;

        if (thresholdMet && ownerRemovalVotes.newOwnerId) {
            // Execute owner removal
            const currentOwnerId = family.ownerId;

            if (currentOwnerId) {
                // Demote current owner to member
                await db
                    .update(familyRoles)
                    .set({ role: 'member', updatedAt: new Date() })
                    .where(and(
                        eq(familyRoles.familyId, Number(familyId)),
                        eq(familyRoles.userId, currentOwnerId)
                    ));
            }

            // Promote new owner
            await db
                .update(familyRoles)
                .set({ role: 'owner', updatedAt: new Date() })
                .where(and(
                    eq(familyRoles.familyId, Number(familyId)),
                    eq(familyRoles.userId, ownerRemovalVotes.newOwnerId)
                ));

            // Update family
            await db
                .update(families)
                .set({
                    ownerId: ownerRemovalVotes.newOwnerId,
                    settings: {
                        ...settings,
                        ownerRemovalVotes: { votes: [], newOwnerId: null, startedAt: null },
                    },
                })
                .where(eq(families.id, Number(familyId)));

            return {
                success: true,
                status: 'owner_removed',
                message: 'Vote threshold reached. Owner has been changed.',
            };
        }

        // Save updated votes
        await db
            .update(families)
            .set({
                settings: { ...settings, ownerRemovalVotes },
            })
            .where(eq(families.id, Number(familyId)));

        return {
            success: true,
            status: 'vote_recorded',
            adminVotes,
            totalVotes,
            adminThreshold: 3,
            memberThreshold: 9,
            message: `Vote recorded. ${adminVotes}/3 admin votes, ${totalVotes}/9 total votes.`,
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});
