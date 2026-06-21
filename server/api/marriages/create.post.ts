import { defineEventHandler, readBody } from 'h3';
import { db } from '../../db';
import { marriages, activityLogs } from '../../db/schema';
import { requireAuth } from '../../utils/auth';
import { getUserRoleInFamily } from '../../utils/permissions';

export default defineEventHandler(async (event) => {
    const { userId } = requireAuth(event);
    const { person1Id, person2Id, familyId, marriageDate, marriageType } = await readBody(event);

    if (!person1Id || !person2Id || !familyId) {
        return { success: false, error: 'person1Id, person2Id, and familyId are required' };
    }

    const role = await getUserRoleInFamily(userId, Number(familyId));
    if (!role) {
        return { success: false, error: 'You do not have permission to manage marriages in this family' };
    }

    try {
        const [marriage] = await db
            .insert(marriages)
            .values({
                person1Id: Number(person1Id),
                person2Id: Number(person2Id),
                marriageDate: marriageDate || null,
                marriageType: marriageType || null,
                createdBy: userId,
            })
            .returning();

        await db
            .insert(activityLogs)
            .values({
                personId: Number(person1Id),
                familyId: Number(familyId),
                actionType: 'ADDED_MARRIAGE',
                performedBy: userId,
                details: {
                    person1Id,
                    person2Id,
                },
            });

        return { success: true, data: marriage };
    } catch (error: any) {
        console.error('Error creating marriage:', error);
        return { success: false, error: error.message };
    }
});
