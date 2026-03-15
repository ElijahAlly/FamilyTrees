import { defineEventHandler, getQuery } from 'h3';
import { db } from '../../db';
import { claimRequests, people, authUsers } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../../utils/auth';

export default defineEventHandler(async (event) => {
    const { userId } = requireAuth(event);
    const { familyId } = getQuery(event);

    try {
        let results;

        if (familyId) {
            // Get all pending claims for a specific family (admin view)
            results = await db
                .select()
                .from(claimRequests)
                .where(and(
                    eq(claimRequests.familyId, Number(familyId)),
                    eq(claimRequests.status, 'pending')
                ));
        } else {
            // Get all pending claims by a specific user
            results = await db
                .select()
                .from(claimRequests)
                .where(and(
                    eq(claimRequests.requesterId, userId),
                    eq(claimRequests.status, 'pending')
                ));
        }

        // Enrich with requester and person names
        const enriched = await Promise.all(results.map(async (claim) => {
            let requesterName = '';
            let requesterEmail = '';
            let personName = '';

            if (claim.requesterId) {
                const [user] = await db
                    .select()
                    .from(authUsers)
                    .where(eq(authUsers.id, claim.requesterId))
                    .limit(1);
                if (user) requesterEmail = user.email;

                const [person] = await db
                    .select({ firstName: people.firstName, lastName: people.lastName })
                    .from(people)
                    .where(eq(people.userId, claim.requesterId))
                    .limit(1);
                if (person) requesterName = `${person.firstName} ${person.lastName}`;
            }

            if (claim.personId) {
                const [person] = await db
                    .select({ firstName: people.firstName, lastName: people.lastName })
                    .from(people)
                    .where(eq(people.id, claim.personId))
                    .limit(1);
                if (person) personName = `${person.firstName} ${person.lastName}`;
            }

            return {
                ...claim,
                requesterName,
                requesterEmail,
                personName,
            };
        }));

        return { data: enriched };
    } catch (error: any) {
        return { data: [], error: error.message };
    }
});
