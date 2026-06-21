import { defineEventHandler, readBody } from 'h3';
import { db } from '../../db';
import { marriages, activityLogs } from '../../db/schema';
import { eq, or, and } from 'drizzle-orm';
import { requireAuth } from '../../utils/auth';
import { getUserRoleInFamily, ROLE_HIERARCHY } from '../../utils/permissions';

export default defineEventHandler(async (event) => {
    const { userId } = requireAuth(event);
    const { marriageId, person1Id, person2Id, familyId } = await readBody(event);

    if (!familyId) {
        return { success: false, error: 'familyId is required' };
    }

    // Must be at least a member
    const role = await getUserRoleInFamily(userId, Number(familyId));
    if (!role) {
        return { success: false, error: 'You do not have permission to manage marriages in this family' };
    }

    try {
        if (marriageId) {
            // Delete by marriage ID
            await db
                .delete(marriages)
                .where(eq(marriages.id, Number(marriageId)));
        } else if (person1Id && person2Id) {
            // Delete by person pair (either direction)
            await db
                .delete(marriages)
                .where(
                    or(
                        and(
                            eq(marriages.person1Id, Number(person1Id)),
                            eq(marriages.person2Id, Number(person2Id))
                        ),
                        and(
                            eq(marriages.person1Id, Number(person2Id)),
                            eq(marriages.person2Id, Number(person1Id))
                        )
                    )
                );
        } else {
            return { success: false, error: 'Either marriageId or both person1Id and person2Id are required' };
        }

        // Log activity
        await db
            .insert(activityLogs)
            .values({
                personId: Number(person1Id || 0),
                familyId: Number(familyId),
                actionType: 'REMOVED_MARRIAGE',
                performedBy: userId,
                details: {
                    marriageId,
                    person1Id,
                    person2Id,
                },
            });

        return { success: true };
    } catch (error: any) {
        console.error('Error deleting marriage:', error);
        return { success: false, error: error.message };
    }
});
