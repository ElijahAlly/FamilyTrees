import { defineEventHandler, readBody } from 'h3';
import { db } from '../../db';
import { claimRequests } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../../utils/auth';

export default defineEventHandler(async (event) => {
    const { userId } = requireAuth(event);
    const { claimId } = await readBody(event);

    if (!claimId) {
        return { success: false, error: 'claimId is required' };
    }

    try {
        const [claim] = await db
            .select()
            .from(claimRequests)
            .where(and(
                eq(claimRequests.id, Number(claimId)),
                eq(claimRequests.requesterId, userId)
            ))
            .limit(1);

        if (!claim) {
            return { success: false, error: 'Claim not found or you are not the requester' };
        }

        if (claim.status !== 'pending') {
            return { success: false, error: 'Only pending claims can be cancelled' };
        }

        await db
            .update(claimRequests)
            .set({
                status: 'cancelled',
                resolvedAt: new Date(),
            })
            .where(eq(claimRequests.id, Number(claimId)));

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});
