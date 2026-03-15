import { defineEventHandler, readBody } from 'h3';
import { db } from '../../db';
import { families } from '../../db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { requireAuth } from '../../utils/auth';
import { isAdminOrAbove } from '../../utils/permissions';

export default defineEventHandler(async (event) => {
    const { userId } = requireAuth(event);
    const { familyId, visibility, settings, regenerateAccessCode } = await readBody(event);

    if (!familyId) {
        return { success: false, error: 'familyId is required' };
    }

    try {
        // Verify user is an admin
        const [family] = await db
            .select()
            .from(families)
            .where(eq(families.id, Number(familyId)))
            .limit(1);

        if (!family) {
            return { success: false, error: 'Family not found' };
        }

        const hasPermission = await isAdminOrAbove(userId, Number(familyId));
        if (!hasPermission) {
            return { success: false, error: 'You are not an admin of this family' };
        }

        const updates: Record<string, any> = {};

        if (visibility !== undefined) {
            updates.visibility = visibility;
            // Generate new access code when switching to private
            if (visibility === 'private' && !family.accessCode) {
                updates.accessCode = crypto.randomBytes(6).toString('hex').toUpperCase();
            }
        }

        if (settings !== undefined) {
            updates.settings = { ...(family.settings as object), ...settings };
        }

        if (regenerateAccessCode) {
            updates.accessCode = crypto.randomBytes(6).toString('hex').toUpperCase();
        }

        if (Object.keys(updates).length === 0) {
            return { success: false, error: 'No updates provided' };
        }

        const [updated] = await db
            .update(families)
            .set(updates)
            .where(eq(families.id, Number(familyId)))
            .returning();

        return { success: true, data: updated };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});
