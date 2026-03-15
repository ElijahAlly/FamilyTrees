import { defineEventHandler, readBody } from 'h3';
import { db } from '../../db';
import { inviteLinks } from '../../db/schema';
import crypto from 'crypto';
import { requireAuth } from '../../utils/auth';
import { isAdminOrAbove } from '../../utils/permissions';

export default defineEventHandler(async (event) => {
    const { userId } = requireAuth(event);
    const { familyId, count, maxUsesPerLink, expiresInDays } = await readBody(event);

    if (!familyId || !count) {
        return { success: false, error: 'familyId and count are required' };
    }

    const linkCount = Math.min(Math.max(1, Number(count)), 50); // Cap at 50

    try {
        // Verify user is an admin
        const hasPermission = await isAdminOrAbove(userId, Number(familyId));
        if (!hasPermission) {
            return { success: false, error: 'Only admins can create invite links' };
        }

        let expiresAt = null;
        if (expiresInDays) {
            expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + Number(expiresInDays));
        }

        const values = Array.from({ length: linkCount }, () => ({
            type: 'family' as const,
            code: crypto.randomBytes(8).toString('base64url'),
            familyId: Number(familyId),
            createdBy: userId,
            maxUses: maxUsesPerLink ? Number(maxUsesPerLink) : 1,
            expiresAt,
        }));

        const created = await db
            .insert(inviteLinks)
            .values(values)
            .returning();

        return { success: true, data: created };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});
