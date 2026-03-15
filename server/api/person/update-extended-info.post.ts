import { defineEventHandler, readBody } from 'h3';
import { db } from '../../db';
import { people } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '../../utils/auth';

export default defineEventHandler(async (event) => {
    const { userId } = requireAuth(event);
    const { personId, extendedInfo } = await readBody(event);

    if (!personId || !extendedInfo) {
        return { success: false, error: 'personId and extendedInfo are required' };
    }

    try {
        // Verify the user owns this person record
        const [person] = await db
            .select()
            .from(people)
            .where(eq(people.id, Number(personId)))
            .limit(1);

        if (!person) {
            return { success: false, error: 'Person not found' };
        }

        if (person.claimedBy !== userId && person.userId !== userId) {
            return { success: false, error: 'Only the claimed user can update extended info' };
        }

        // Merge with existing extended info
        const currentExtended = (person.extendedInfo || {}) as Record<string, any>;
        const mergedInfo = { ...currentExtended, ...extendedInfo };

        const [updated] = await db
            .update(people)
            .set({
                extendedInfo: mergedInfo,
                updatedBy: userId,
            })
            .where(eq(people.id, Number(personId)))
            .returning();

        return { success: true, data: updated };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});
