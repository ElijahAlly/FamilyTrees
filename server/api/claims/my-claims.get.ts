import { defineEventHandler } from 'h3';
import { db } from '../../db';
import { claimRequests, families, people } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { requireAuth } from '../../utils/auth';

export default defineEventHandler(async (event) => {
    const { userId } = requireAuth(event);

    try {
        const results = await db
            .select()
            .from(claimRequests)
            .where(eq(claimRequests.requesterId, userId))
            .orderBy(desc(claimRequests.createdAt));

        // Enrich with family and person names
        const enriched = await Promise.all(results.map(async (claim) => {
            let familyName = '';
            let personName = '';

            if (claim.familyId) {
                const [family] = await db
                    .select({ familyName: families.familyName })
                    .from(families)
                    .where(eq(families.id, claim.familyId))
                    .limit(1);
                if (family) familyName = family.familyName;
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
                familyName,
                personName,
            };
        }));

        return { data: enriched };
    } catch (error: any) {
        return { data: [], error: error.message };
    }
});
