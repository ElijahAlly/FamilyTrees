import { defineEventHandler, readBody } from 'h3';
import { db } from '../db';
import { activityLogs } from '../db/schema';
import { requireAuth } from '../utils/auth';

export default defineEventHandler(async (event) => {
    const { userId } = requireAuth(event);
    const { personId, familyId, actionType, details, reason } = await readBody(event);

    if (!personId || !familyId || !actionType) {
        return { error: 'personId, familyId, and actionType are required' };
    }

    try {
        const [log] = await db
            .insert(activityLogs)
            .values({
                personId: Number(personId),
                familyId: Number(familyId),
                actionType,
                details: details || {},
                performedBy: userId,
                reason: reason || null,
            })
            .returning();

        return { data: log };
    } catch (error) {
        return { error };
    }
});
