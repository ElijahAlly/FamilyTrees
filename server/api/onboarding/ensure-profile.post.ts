import { defineEventHandler, readBody } from 'h3';
import { db } from '../../db';
import { people } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '../../utils/auth';

export default defineEventHandler(async (event) => {
    const { userId } = requireAuth(event);
    const { firstName, lastName } = await readBody(event);

    try {
        // Check if person record already exists
        const [existing] = await db
            .select()
            .from(people)
            .where(eq(people.userId, userId))
            .limit(1);

        if (existing) {
            return { data: existing };
        }

        // Create a new person record for this user
        const [newPerson] = await db
            .insert(people)
            .values({
                firstName: firstName || 'User',
                lastName: lastName || '',
                userId,
                createdBy: userId,
                onboardingCompleted: false,
            })
            .returning();

        return { data: newPerson };
    } catch (error: any) {
        return { data: null, error: error.message };
    }
});
