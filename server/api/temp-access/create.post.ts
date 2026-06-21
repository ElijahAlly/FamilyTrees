import { defineEventHandler, readBody } from 'h3';
import { db } from '../../db';
import { tempAccess } from '../../db/schema';
import { requireAuth } from '../../utils/auth';
import { isAdminOrAbove } from '../../utils/permissions';

export default defineEventHandler(async (event) => {
    const { userId } = requireAuth(event);
    const { familyId, email, accessType, personId, expiresInDays, maxVisits } = await readBody(event);

    if (!familyId || !email || !accessType) {
        return { success: false, error: 'familyId, email, and accessType are required' };
    }

    if (!['family', 'person'].includes(accessType)) {
        return { success: false, error: 'accessType must be family or person' };
    }

    if (accessType === 'person' && !personId) {
        return { success: false, error: 'personId is required for person access type' };
    }

    if (!expiresInDays && !maxVisits) {
        return { success: false, error: 'At least one of expiresInDays or maxVisits must be provided' };
    }

    try {
        // Verify user is an admin
        const hasPermission = await isAdminOrAbove(userId, Number(familyId));
        if (!hasPermission) {
            return { success: false, error: 'Only admins can grant temporary access' };
        }

        const expiresAt = new Date();
        if (expiresInDays) {
            expiresAt.setDate(expiresAt.getDate() + Number(expiresInDays));
        } else {
            // Default to 30 days if only maxVisits is set
            expiresAt.setDate(expiresAt.getDate() + 30);
        }

        // targetId stores the family or person ID as a string
        const targetId = accessType === 'person' ? String(personId) : String(familyId);

        const [created] = await db
            .insert(tempAccess)
            .values({
                email,
                accessType,
                targetId,
                expiresAt,
                maxVisits: maxVisits ? Number(maxVisits) : null,
                visitsUsed: 0,
                createdBy: userId,
            })
            .returning();

        return { success: true, data: created };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});
