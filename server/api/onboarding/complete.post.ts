import { defineEventHandler, readBody } from 'h3';
import { db } from '../../db';
import { people } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '../../utils/auth';

export default defineEventHandler(async (event) => {
    const { userId } = requireAuth(event);
    const { personId, birthDate, gender } = await readBody(event);

    if (!personId) {
        return { success: false, error: 'personId is required' };
    }

    try {
        const updateData: Record<string, any> = {
            onboardingCompleted: true,
        };

        if (birthDate) {
            updateData.birthDate = birthDate;
        }

        if (gender) {
            updateData.gender = gender;
        }

        const [updated] = await db
            .update(people)
            .set(updateData)
            .where(eq(people.id, Number(personId)))
            .returning();

        return { success: true, data: updated };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});
