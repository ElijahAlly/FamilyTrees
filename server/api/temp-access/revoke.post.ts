import { defineEventHandler, readBody } from 'h3';
import { db } from '../../db';
import { tempAccess } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '../../utils/auth';
import { isAdminOrAbove } from '../../utils/permissions';

export default defineEventHandler(async (event) => {
    const { userId } = requireAuth(event);
    const { tempAccessId, familyId } = await readBody(event);

    if (!tempAccessId || !familyId) {
        return { success: false, error: 'tempAccessId and familyId are required' };
    }

    try {
        // Verify user is an admin
        const hasPermission = await isAdminOrAbove(userId, Number(familyId));
        if (!hasPermission) {
            return { success: false, error: 'Only admins can revoke temporary access' };
        }

        // Revoke by setting expiration to now
        const [updated] = await db
            .update(tempAccess)
            .set({ expiresAt: new Date() })
            .where(eq(tempAccess.id, tempAccessId))
            .returning();

        if (!updated) {
            return { success: false, error: 'Temporary access record not found' };
        }

        return { success: true, data: updated };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});
