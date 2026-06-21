import { defineEventHandler, readBody } from 'h3';
import { db } from '../../db';
import { mediaSubmissions } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '../../utils/auth';
import { isAdminOrAbove } from '../../utils/permissions';

export default defineEventHandler(async (event) => {
    const { userId } = requireAuth(event);
    const { submissionId, action } = await readBody(event);

    if (!submissionId || !action) {
        return { success: false, error: 'submissionId and action are required' };
    }

    if (!['approve', 'deny'].includes(action)) {
        return { success: false, error: 'action must be "approve" or "deny"' };
    }

    try {
        const [submission] = await db
            .select()
            .from(mediaSubmissions)
            .where(eq(mediaSubmissions.id, Number(submissionId)))
            .limit(1);

        if (!submission) {
            return { success: false, error: 'Submission not found' };
        }

        if (submission.status !== 'pending') {
            return { success: false, error: 'This submission has already been reviewed' };
        }

        // Verify user is admin of the family
        const hasPermission = await isAdminOrAbove(userId, submission.familyId);
        if (!hasPermission) {
            return { success: false, error: 'Only admins can review media submissions' };
        }

        const [updated] = await db
            .update(mediaSubmissions)
            .set({
                status: action === 'approve' ? 'approved' : 'denied',
                reviewedBy: userId,
                reviewedAt: new Date(),
            })
            .where(eq(mediaSubmissions.id, Number(submissionId)))
            .returning();

        return { success: true, data: updated };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});
