import { defineEventHandler, readBody } from 'h3';
import { db } from '../../db';
import { people, familyMemberships } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../../utils/auth';

export default defineEventHandler(async (event) => {
    const { userId } = requireAuth(event);
    const { personId } = await readBody(event);

    if (!personId) {
        return { success: false, error: 'personId is required' };
    }

    try {
        // Verify the user owns this person record
        const [person] = await db
            .select()
            .from(people)
            .where(eq(people.id, Number(personId)))
            .limit(1);

        if (!person) {
            return { success: false, error: 'Person not found' };
        }

        if (person.claimedBy !== userId && person.userId !== userId) {
            return { success: false, error: 'You can only delete your own profile' };
        }

        // Soft delete: clear personal data but keep first/last name and tree structure
        // Per the spec: "the following will still be visible in the tree and family details:
        // Only First and Last name (not middle)"
        await db
            .update(people)
            .set({
                middleName: null,
                birthDate: null,
                deathDate: null,
                gender: null,
                pictures: [],
                profilePicture: '',
                privacySettings: {
                    familyView: false,
                    friendsView: false,
                    publicView: false,
                    timeBasedRules: [],
                    ageRestrictions: null,
                    requireSameLastName: false,
                },
                extendedInfo: {},
                claimedBy: null,
                userId: null,
                updatedBy: userId,
            })
            .where(eq(people.id, Number(personId)));

        // Remove all family memberships for this user
        const memberships = await db
            .select()
            .from(familyMemberships)
            .where(eq(familyMemberships.userId, userId));

        for (const m of memberships) {
            await db
                .update(familyMemberships)
                .set({
                    status: 'removed',
                    removedAt: new Date(),
                })
                .where(eq(familyMemberships.id, m.id));
        }

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});
