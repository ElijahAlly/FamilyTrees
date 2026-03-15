import { defineEventHandler, readBody } from 'h3';
import { db } from '../../db';
import { mediaSubmissions, families } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '../../utils/auth';
import { isAdminOrAbove } from '../../utils/permissions';

export default defineEventHandler(async (event) => {
    const { userId } = requireAuth(event);
    const { familyId, mediaUrl, caption } = await readBody(event);

    if (!familyId || !mediaUrl) {
        return { success: false, error: 'familyId and mediaUrl are required' };
    }

    try {
        // Check if user is an admin — admins skip approval
        const [family] = await db
            .select()
            .from(families)
            .where(eq(families.id, Number(familyId)))
            .limit(1);

        if (!family) {
            return { success: false, error: 'Family not found' };
        }

        const isAdmin = await isAdminOrAbove(userId, Number(familyId));
        const settings = family.settings as any;
        const requiresApproval = settings?.requireMediaApproval && !isAdmin;

        const [submission] = await db
            .insert(mediaSubmissions)
            .values({
                familyId: Number(familyId),
                submittedBy: userId,
                mediaUrl,
                caption: caption || null,
                status: requiresApproval ? 'pending' : 'approved',
                reviewedAt: requiresApproval ? null : new Date(),
                reviewedBy: requiresApproval ? null : userId,
            })
            .returning();

        return {
            success: true,
            data: submission,
            requiresApproval,
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});
