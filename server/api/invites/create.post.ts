import { defineEventHandler, readBody } from 'h3';
import { db } from '../../db';
import { inviteLinks } from '../../db/schema';
import crypto from 'crypto';
import { requireAuth } from '../../utils/auth';
import { isAdminOrAbove } from '../../utils/permissions';
import { checkRateLimit, inviteLimiter } from '../../utils/rate-limit';

export default defineEventHandler(async (event) => {
    checkRateLimit(event, inviteLimiter, 'invite-create');
    const { userId } = requireAuth(event);
    const { familyId, personId, type, maxUses, expiresInDays } = await readBody(event);

    if (!familyId || !type) {
        return { success: false, error: 'familyId and type are required' };
    }

    try {
        // Verify user is an admin
        const hasPermission = await isAdminOrAbove(userId, Number(familyId));
        if (!hasPermission) {
            return { success: false, error: 'Only admins can create invite links' };
        }

        // Generate a unique invite code
        const code = crypto.randomBytes(8).toString('base64url');

        // Calculate expiry
        let expiresAt = null;
        if (expiresInDays) {
            expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + Number(expiresInDays));
        }

        const [invite] = await db
            .insert(inviteLinks)
            .values({
                type,
                code,
                familyId: Number(familyId),
                personId: personId ? Number(personId) : null,
                createdBy: userId,
                maxUses: maxUses ? Number(maxUses) : null,
                expiresAt,
            })
            .returning();

        return { success: true, data: invite };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});
