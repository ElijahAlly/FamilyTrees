import { defineEventHandler, getQuery } from 'h3';
import { db } from '../../db';
import { tempAccess } from '../../db/schema';
import { eq, and, gt, or, isNull } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
    const { email, accessType, targetId } = getQuery(event);

    if (!email || !accessType || !targetId) {
        return { success: false, error: 'email, accessType, and targetId are required' };
    }

    try {
        const now = new Date();

        const records = await db
            .select()
            .from(tempAccess)
            .where(and(
                eq(tempAccess.email, email as string),
                eq(tempAccess.accessType, accessType as 'family' | 'person'),
                eq(tempAccess.targetId, targetId as string),
                gt(tempAccess.expiresAt, now),
            ));

        // Filter for records that still have visits remaining
        const valid = records.filter(r => {
            if (r.maxVisits === null) return true;
            return (r.visitsUsed || 0) < r.maxVisits;
        });

        if (valid.length === 0) {
            return { success: false, hasAccess: false, error: 'No valid temporary access found' };
        }

        // Increment visits_used on the first valid record
        const record = valid[0];
        await db
            .update(tempAccess)
            .set({ visitsUsed: (record.visitsUsed || 0) + 1 })
            .where(eq(tempAccess.id, record.id));

        return { success: true, hasAccess: true, data: record };
    } catch (error: any) {
        return { success: false, hasAccess: false, error: error.message };
    }
});
