import { defineEventHandler, readBody } from 'h3';
import { db } from '../../db';
import { families, familyMemberships, familyRoles, people } from '../../db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { requireAuth } from '../../utils/auth';


export default defineEventHandler(async (event) => {
    const { userId } = requireAuth(event);
    const { familyName, visibility, personId } = await readBody(event);

    if (!familyName) {
        return { success: false, error: 'familyName is required' };
    }

    try {
        // Find the person record for this user
        let creatorPersonId = personId;
        if (!creatorPersonId) {
            const [person] = await db
                .select({ id: people.id })
                .from(people)
                .where(eq(people.userId, userId))
                .limit(1);

            if (person) {
                creatorPersonId = person.id;
            }
        }

        // Generate access code for private families
        const accessCode = visibility === 'private'
            ? crypto.randomBytes(6).toString('hex').toUpperCase()
            : null;

        const [newFamily] = await db
            .insert(families)
            .values({
                familyName,
                members: creatorPersonId ? [creatorPersonId] : [],
                admins: [userId],
                ownerId: userId,
                visibility: visibility || 'private',
                accessCode,
                createdBy: creatorPersonId || null,
                settings: {
                    allowMemberInvites: true,
                    minAdminsForApproval: 1,
                    requireMediaApproval: true,
                },
            })
            .returning();

        // Create membership for the creator
        await db
            .insert(familyMemberships)
            .values({
                userId,
                familyId: newFamily.id,
                personId: creatorPersonId || null,
                kind: 'relatives',
                status: 'active',
            });

        // Create owner role for the creator
        await db
            .insert(familyRoles)
            .values({
                familyId: newFamily.id,
                userId,
                role: 'owner',
                assignedBy: userId,
            });

        return { success: true, data: newFamily };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});
