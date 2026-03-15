import { defineEventHandler, readBody } from 'h3';
import { db } from '../../db';
import { people } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../../utils/auth';

export default defineEventHandler(async (event) => {
    const { userId } = requireAuth(event);
    const { personId, privacySettings } = await readBody(event);

    if (!personId || !privacySettings) {
        return { success: false, error: 'personId and privacySettings are required' };
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
            return { success: false, error: 'You can only update privacy settings for your own profile' };
        }

        const [updated] = await db
            .update(people)
            .set({
                privacySettings,
                updatedBy: userId,
            })
            .where(eq(people.id, Number(personId)))
            .returning();

        return { success: true, data: updated };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});
