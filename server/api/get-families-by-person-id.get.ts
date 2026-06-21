import { defineEventHandler, getQuery } from 'h3';
import { db } from '../db';
import { families, familyMemberships, people } from '../db/schema';
import { eq, and, or, inArray } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
    const { personId } = getQuery(event);

    if (!personId) {
        return { data: [], error: 'personId is required' };
    }

    try {
        // Look up the person's userId to also check memberships by userId
        const [person] = await db
            .select({ userId: people.userId })
            .from(people)
            .where(eq(people.id, Number(personId)))
            .limit(1);

        // Build membership query conditions
        const conditions = [eq(familyMemberships.personId, Number(personId))];
        if (person?.userId) {
            conditions.push(eq(familyMemberships.userId, person.userId));
        }

        const memberships = await db
            .select({ familyId: familyMemberships.familyId })
            .from(familyMemberships)
            .where(
                and(
                    or(...conditions),
                    eq(familyMemberships.status, 'active')
                )
            );

        // Also include families created by this person
        const createdFamilies = await db
            .select()
            .from(families)
            .where(eq(families.createdBy, Number(personId)));

        const familyIds = new Set([
            ...memberships.map(m => m.familyId),
            ...createdFamilies.map(f => f.id),
        ]);

        if (familyIds.size === 0) {
            return { data: [] };
        }

        const data = await db
            .select()
            .from(families)
            .where(inArray(families.id, [...familyIds]));

        return { data };
    } catch (error: any) {
        return { data: [], error: error.message };
    }
});
