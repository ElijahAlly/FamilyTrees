import { defineEventHandler, getQuery } from 'h3';
import { db } from '../../db';
import { inviteLinks, families, people } from '../../db/schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
    const { code } = getQuery(event);

    if (!code) {
        return { valid: false, error: 'code is required' };
    }

    try {
        const [invite] = await db
            .select()
            .from(inviteLinks)
            .where(eq(inviteLinks.code, code as string))
            .limit(1);

        if (!invite) {
            return { valid: false, error: 'Invalid invite code' };
        }

        if (!invite.isActive) {
            return { valid: false, error: 'This invite link has been deactivated' };
        }

        if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
            return { valid: false, error: 'This invite link has expired' };
        }

        if (invite.maxUses && invite.usesCount >= invite.maxUses) {
            return { valid: false, error: 'This invite link has reached its maximum uses' };
        }

        // Get family details
        let familyName = '';
        let personName = '';

        const [family] = await db
            .select({ familyName: families.familyName })
            .from(families)
            .where(eq(families.id, invite.familyId))
            .limit(1);
        if (family) familyName = family.familyName;

        if (invite.personId) {
            const [person] = await db
                .select({ firstName: people.firstName, lastName: people.lastName })
                .from(people)
                .where(eq(people.id, invite.personId))
                .limit(1);
            if (person) personName = `${person.firstName} ${person.lastName}`;
        }

        return {
            valid: true,
            data: {
                ...invite,
                familyName,
                personName,
            },
        };
    } catch (error: any) {
        return { valid: false, error: error.message };
    }
});
