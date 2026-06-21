import { defineEventHandler, readBody } from 'h3';
import { db } from '../../db';
import { people, familyMemberships } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../../utils/auth';
import { isAdminOrAbove } from '../../utils/permissions';

export default defineEventHandler(async (event) => {
    const { userId } = requireAuth(event);
    const { personId, familyId, action } = await readBody(event);

    if (!personId || !action) {
        return { success: false, error: 'personId and action are required' };
    }

    if (!['archive', 'restore'].includes(action)) {
        return { success: false, error: 'action must be archive or restore' };
    }

    try {
        const [person] = await db
            .select()
            .from(people)
            .where(eq(people.id, Number(personId)))
            .limit(1);

        if (!person) {
            return { success: false, error: 'Person not found' };
        }

        // Check authorization: must be admin of the family OR the claimed person
        let isAuthorized = false;

        if (person.claimedBy === userId || person.userId === userId) {
            isAuthorized = true;
        }

        if (!isAuthorized && familyId) {
            const hasPermission = await isAdminOrAbove(userId, Number(familyId));
            if (hasPermission) {
                isAuthorized = true;
            }
        }

        if (!isAuthorized) {
            return { success: false, error: 'Only admins or the person who claimed this profile can archive/restore it' };
        }

        if (action === 'archive') {
            // Archive: clear personal details but keep name and tree structure
            // This is a soft delete — data is cleared but record remains
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
                    extendedInfo: { _archived: true, _archivedAt: new Date().toISOString(), _archivedBy: userId },
                    updatedBy: userId,
                })
                .where(eq(people.id, Number(personId)));

            // Remove memberships for the person's claimed user
            if (person.userId) {
                const memberships = await db
                    .select()
                    .from(familyMemberships)
                    .where(and(
                        eq(familyMemberships.userId, person.userId),
                        eq(familyMemberships.status, 'active')
                    ));

                for (const m of memberships) {
                    await db
                        .update(familyMemberships)
                        .set({ status: 'removed', removedAt: new Date() })
                        .where(eq(familyMemberships.id, m.id));
                }
            }

            return { success: true, data: { action: 'archived', personId: Number(personId) } };
        } else {
            // Restore: we can only restore the record structure, not the cleared data
            // The extendedInfo._archived flag is used to detect archived state
            const extendedInfo = (person.extendedInfo || {}) as any;

            if (!extendedInfo._archived) {
                return { success: false, error: 'Person is not archived' };
            }

            const { _archived, _archivedAt, _archivedBy, ...restInfo } = extendedInfo;

            await db
                .update(people)
                .set({
                    privacySettings: {
                        familyView: true,
                        friendsView: false,
                        publicView: false,
                        timeBasedRules: [],
                        ageRestrictions: null,
                        requireSameLastName: false,
                    },
                    extendedInfo: restInfo,
                    updatedBy: userId,
                })
                .where(eq(people.id, Number(personId)));

            // Restore memberships
            if (person.userId) {
                const removedMemberships = await db
                    .select()
                    .from(familyMemberships)
                    .where(and(
                        eq(familyMemberships.userId, person.userId),
                        eq(familyMemberships.status, 'removed')
                    ));

                for (const m of removedMemberships) {
                    await db
                        .update(familyMemberships)
                        .set({ status: 'active', removedAt: null })
                        .where(eq(familyMemberships.id, m.id));
                }
            }

            return { success: true, data: { action: 'restored', personId: Number(personId) } };
        }
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});
