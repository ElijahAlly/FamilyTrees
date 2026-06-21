import { defineEventHandler } from 'h3';
import { db } from '../../db';
import { familyMemberships, families, people } from '../../db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { requireAuth } from '../../utils/auth';

export default defineEventHandler(async (event) => {
    const { userId } = requireAuth(event);

    try {
        const memberships = await db
            .select()
            .from(familyMemberships)
            .where(and(
                eq(familyMemberships.userId, userId),
                ne(familyMemberships.status, 'removed')
            ));

        // Enrich with family and person names
        const enriched = await Promise.all(memberships.map(async (m) => {
            let familyName = '';
            let personName = '';

            const [family] = await db
                .select({ familyName: families.familyName })
                .from(families)
                .where(eq(families.id, m.familyId))
                .limit(1);
            if (family) familyName = family.familyName;

            if (m.personId) {
                const [person] = await db
                    .select({ firstName: people.firstName, lastName: people.lastName })
                    .from(people)
                    .where(eq(people.id, m.personId))
                    .limit(1);
                if (person) personName = `${person.firstName} ${person.lastName}`;
            }

            return {
                ...m,
                familyName,
                personName,
            };
        }));

        return { data: enriched };
    } catch (error: any) {
        return { data: [], error: error.message };
    }
});
