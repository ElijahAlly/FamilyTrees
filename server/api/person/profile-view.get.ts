import { defineEventHandler, getQuery } from 'h3';
import { db } from '../../db';
import { people, families, familyMemberships, friendships } from '../../db/schema';
import { eq, and, or } from 'drizzle-orm';
import type { PrivacyControls } from '../../../types/privacy';

type ViewerRelationship = 'self' | 'family' | 'friend' | 'public';

export default defineEventHandler(async (event) => {
    const { personId, viewerId } = getQuery(event);

    if (!personId) {
        return { data: null, error: 'personId is required' };
    }

    try {
        const [person] = await db
            .select()
            .from(people)
            .where(eq(people.id, Number(personId)))
            .limit(1);

        if (!person) {
            return { data: null, error: 'Person not found' };
        }

        // Determine the viewer's relationship to this person
        const relationship = await getViewerRelationship(
            person,
            viewerId as string | undefined
        );

        // Apply privacy filters based on relationship
        const filteredPerson = applyPrivacyFilters(person, relationship);

        return {
            data: filteredPerson,
            relationship,
        };
    } catch (error: any) {
        return { data: null, error: error.message };
    }
});

async function getViewerRelationship(
    person: any,
    viewerId: string | undefined
): Promise<ViewerRelationship> {
    if (!viewerId) return 'public';

    // Check if viewer is the person themselves
    if (person.userId === viewerId || person.claimedBy === viewerId) {
        return 'self';
    }

    // Check if viewer is in the same family
    const personFamilyMemberships = await db
        .select({ familyId: familyMemberships.familyId })
        .from(familyMemberships)
        .where(and(
            eq(familyMemberships.userId, person.userId || ''),
            eq(familyMemberships.status, 'active')
        ));

    if (personFamilyMemberships.length > 0) {
        const familyIds = personFamilyMemberships.map(m => m.familyId);

        for (const fId of familyIds) {
            const [viewerMembership] = await db
                .select()
                .from(familyMemberships)
                .where(and(
                    eq(familyMemberships.userId, viewerId),
                    eq(familyMemberships.familyId, fId),
                    eq(familyMemberships.status, 'active')
                ))
                .limit(1);

            if (viewerMembership) return 'family';
        }
    }

    // Check if viewer is a friend
    const [friendship] = await db
        .select()
        .from(friendships)
        .where(and(
            or(
                and(eq(friendships.userId, viewerId), eq(friendships.friendId, person.userId || '')),
                and(eq(friendships.userId, person.userId || ''), eq(friendships.friendId, viewerId))
            ),
            eq(friendships.status, 'accepted')
        ))
        .limit(1);

    if (friendship) return 'friend';

    return 'public';
}

function applyPrivacyFilters(person: any, relationship: ViewerRelationship) {
    // Self always sees everything
    if (relationship === 'self') {
        return { ...person, viewType: 'private' as const };
    }

    const privacy = (person.privacySettings || {}) as PrivacyControls;

    // Check time-based rules
    const now = new Date();
    const groupMap: Record<string, 'family' | 'friends' | 'public'> = {
        family: 'family',
        friend: 'friends',
        public: 'public',
    };
    const group = groupMap[relationship];

    if (privacy.timeBasedRules?.length) {
        for (const rule of privacy.timeBasedRules) {
            if (rule.group === group) {
                if (rule.showAfter && new Date(rule.showAfter) > now) {
                    return buildRedactedPerson(person);
                }
                if (rule.hideAfter && new Date(rule.hideAfter) < now) {
                    return buildRedactedPerson(person);
                }
            }
        }
    }

    // Check view toggle
    if (relationship === 'family' && !privacy.familyView) {
        return buildRedactedPerson(person);
    }
    if (relationship === 'friend' && !privacy.friendsView) {
        return buildRedactedPerson(person);
    }
    if (relationship === 'public' && !privacy.publicView) {
        return buildRedactedPerson(person);
    }

    // Family view with same-last-name requirement
    if (relationship === 'family' && privacy.requireSameLastName) {
        // For now, return full data — the frontend should check last name match
        // This is enriched so the component can decide
    }

    // Return data appropriate for the view level
    const base = {
        id: person.id,
        firstName: person.firstName,
        lastName: person.lastName,
        middleName: person.middleName,
        birthDate: person.birthDate,
        deathDate: person.deathDate,
        gender: person.gender,
        isLiving: person.isLiving,
        pictures: person.pictures,
        profilePicture: person.profilePicture,
        motherId: person.motherId,
        fatherId: person.fatherId,
        viewType: relationship,
    };

    if (relationship === 'family') {
        return {
            ...base,
            extendedInfo: person.extendedInfo,
        };
    }

    if (relationship === 'friend') {
        return {
            ...base,
            extendedInfo: person.extendedInfo,
        };
    }

    // Public view — limited info
    return {
        ...base,
        extendedInfo: {},
    };
}

function buildRedactedPerson(person: any) {
    return {
        id: person.id,
        firstName: person.firstName,
        lastName: person.lastName,
        middleName: null,
        birthDate: null,
        deathDate: null,
        gender: null,
        isLiving: person.isLiving,
        pictures: [],
        profilePicture: '',
        motherId: person.motherId,
        fatherId: person.fatherId,
        extendedInfo: {},
        viewType: 'redacted' as const,
    };
}
