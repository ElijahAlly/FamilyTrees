import { defineEventHandler, getQuery } from 'h3';
import { db } from '../db';
import { families } from '../db/schema';
import { eq } from 'drizzle-orm';


export default defineEventHandler(async (event) => {
    const { id } = getQuery(event);

    if (!id) {
        return { error: 'id is required' };
    }

    try {
        const data = await db
            .select()
            .from(families)
            .where(eq(families.id, Number(id)));

        // Normalize null members to empty array
        const normalized = data.map(f => ({
            ...f,
            members: f.members ?? [],
        }));

        return { data: normalized };
    } catch (error) {
        return { error };
    }
});
