import { defineEventHandler, getQuery } from 'h3';
import { db } from '../../db';
import { families, familyMemberships, people, authUsers } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../../utils/auth';
import { isAdminOrAbove } from '../../utils/permissions';

export default defineEventHandler(async (event) => {
    const { userId } = requireAuth(event);
    const { familyId } = getQuery(event);

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

        const admins = (family.admins || []) as string[];
        const hasPermission = await isAdminOrAbove(userId, Number(familyId));
        if (!hasPermission) {
            return { success: false, error: 'You are not an admin of this family' };
        }

        // Get active memberships with person info
        const memberships = await db
            .select()
            .from(familyMemberships)
            .where(and(
                eq(familyMemberships.familyId, Number(familyId)),
                eq(familyMemberships.status, 'active')
            ));

        const enriched = await Promise.all(memberships.map(async (m) => {
            let personName = '';
            let email = '';

            if (m.personId) {
                const [person] = await db
                    .select({ firstName: people.firstName, lastName: people.lastName })
                    .from(people)
                    .where(eq(people.id, m.personId))
                    .limit(1);
                if (person) personName = `${person.firstName} ${person.lastName}`;
            }

            const [user] = await db
                .select({ email: authUsers.email })
                .from(authUsers)
                .where(eq(authUsers.id, m.userId))
                .limit(1);
            if (user) email = user.email;

            return {
                ...m,
                personName,
                email,
                isAdmin: admins.includes(m.userId),
            };
        }));

        return { success: true, data: enriched };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});
