import { defineEventHandler, getQuery } from 'h3';
import { db } from '../db';
import { families, people } from '../db/schema';
import { eq, sql } from 'drizzle-orm';


export default defineEventHandler(async (event) => {
    const { table, eq: eqField, familyName, limit } = getQuery(event);
    const limitNum = limit ? Number(limit) : 3;

    try {
        if (table === 'people' && eqField && familyName) {
            const data = await db
                .select()
                .from(people)
                .where(eq(people[eqField as keyof typeof people] as any, familyName as string));

            return { data };
        }

        if (!familyName || !eqField) {
            const data = await db
                .select()
                .from(families)
                .limit(limitNum);

            return { data };
        }

        const data = await db
            .select()
            .from(families)
            .where(eq(families[eqField as keyof typeof families] as any, familyName as string));

        return { data };
    } catch (error) {
        return { error };
    }
});
