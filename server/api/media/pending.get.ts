import { defineEventHandler, getQuery } from 'h3';
import { db } from '../../db';
import { mediaSubmissions, people } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../../utils/auth';
import { isAdminOrAbove } from '../../utils/permissions';

export default defineEventHandler(async (event) => {
    const { userId } = requireAuth(event);
    const { familyId } = getQuery(event);

    if (!familyId) {
        return { data: [], error: 'familyId is required' };
    }

    try {
        // Verify user is admin
        const hasPermission = await isAdminOrAbove(userId, Number(familyId));
        if (!hasPermission) {
            return { data: [], error: 'Only admins can view pending submissions' };
        }

        const submissions = await db
            .select()
            .from(mediaSubmissions)
            .where(and(
                eq(mediaSubmissions.familyId, Number(familyId)),
                eq(mediaSubmissions.status, 'pending')
            ));

        // Enrich with submitter names
        const enriched = await Promise.all(submissions.map(async (s) => {
            let submitterName = '';
            const [person] = await db
                .select({ firstName: people.firstName, lastName: people.lastName })
                .from(people)
                .where(eq(people.userId, s.submittedBy))
                .limit(1);
            if (person) submitterName = `${person.firstName} ${person.lastName}`;

            return { ...s, submitterName };
        }));

        return { data: enriched };
    } catch (error: any) {
        return { data: [], error: error.message };
    }
});
