import { defineEventHandler, getQuery } from 'h3';
import { db } from '../../db';
import { families, people } from '../../db/schema';
import { eq, inArray } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
    const { familyId } = getQuery(event);

    if (!familyId) {
        return { data: [] };
    }

    try {
        const [family] = await db
            .select()
            .from(families)
            .where(eq(families.id, Number(familyId)))
            .limit(1);

        if (!family || !family.members?.length) {
            return { data: [] };
        }

        const memberIds = family.members.filter((id): id is number => id !== null);

        if (!memberIds.length) {
            return { data: [] };
        }

        const members = await db
            .select({
                id: people.id,
                firstName: people.firstName,
                lastName: people.lastName,
                birthDate: people.birthDate,
                gender: people.gender,
                claimedBy: people.claimedBy,
            })
            .from(people)
            .where(inArray(people.id, memberIds));

        return { data: members };
    } catch (error: any) {
        return { data: [], error: error.message };
    }
});
