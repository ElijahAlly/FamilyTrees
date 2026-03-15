import { defineEventHandler, getQuery } from 'h3';
import { db } from '../../db';
import { authUsers } from '../../db/schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
    const { email } = getQuery(event);

    if (!email) {
        return { exists: false };
    }

    try {
        const result = await db
            .select({ id: authUsers.id })
            .from(authUsers)
            .where(eq(authUsers.email, email as string))
            .limit(1);

        return { exists: result.length > 0 };
    } catch (error) {
        return { exists: false, error };
    }
});
