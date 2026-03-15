import { defineEventHandler, getQuery, setHeader } from 'h3';
import { db } from '../../db';
import { families, people, marriages, familyMemberships } from '../../db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { requireAuth } from '../../utils/auth';
import { isAdminOrAbove } from '../../utils/permissions';

export default defineEventHandler(async (event) => {
    const { userId } = requireAuth(event);
    const { familyId, format } = getQuery(event);

    if (!familyId) {
        return { success: false, error: 'familyId is required' };
    }

    try {
        // Verify user is admin or active member
        const [family] = await db
            .select()
            .from(families)
            .where(eq(families.id, Number(familyId)))
            .limit(1);

        if (!family) {
            return { success: false, error: 'Family not found' };
        }

        const hasAdminPermission = await isAdminOrAbove(userId, Number(familyId));
        const memberships = await db
            .select()
            .from(familyMemberships)
            .where(and(
                eq(familyMemberships.familyId, Number(familyId)),
                eq(familyMemberships.userId, userId),
                eq(familyMemberships.status, 'active')
            ));

        if (!hasAdminPermission && memberships.length === 0) {
            return { success: false, error: 'You must be a member of this family to export data' };
        }

        // Get all family members (person IDs from memberships)
        const allMemberships = await db
            .select()
            .from(familyMemberships)
            .where(and(
                eq(familyMemberships.familyId, Number(familyId)),
                eq(familyMemberships.status, 'active')
            ));

        const personIds = allMemberships
            .map(m => m.personId)
            .filter((id): id is number => id !== null);

        // Get people data
        let familyPeople: any[] = [];
        if (personIds.length > 0) {
            familyPeople = await db
                .select()
                .from(people)
                .where(inArray(people.id, personIds));
        }

        // Also get people referenced in the family members array
        const memberIds = (family.members || []).filter((id): id is number => id !== null);
        if (memberIds.length > 0) {
            const additionalPeople = await db
                .select()
                .from(people)
                .where(inArray(people.id, memberIds));

            const existingIds = new Set(familyPeople.map(p => p.id));
            for (const p of additionalPeople) {
                if (!existingIds.has(p.id)) {
                    familyPeople.push(p);
                }
            }
        }

        // Get marriages involving family members
        const allPersonIds = familyPeople.map(p => p.id);
        let familyMarriages: any[] = [];
        if (allPersonIds.length > 0) {
            familyMarriages = await db
                .select()
                .from(marriages)
                .where(inArray(marriages.person1Id, allPersonIds));

            const marriagesAsPerson2 = await db
                .select()
                .from(marriages)
                .where(inArray(marriages.person2Id, allPersonIds));

            const existingMarriageIds = new Set(familyMarriages.map(m => m.id));
            for (const m of marriagesAsPerson2) {
                if (!existingMarriageIds.has(m.id)) {
                    familyMarriages.push(m);
                }
            }
        }

        const exportData = {
            exportedAt: new Date().toISOString(),
            family: {
                id: family.id,
                name: family.familyName,
                visibility: family.visibility,
                createdAt: family.createdAt,
            },
            people: familyPeople.map(p => ({
                id: p.id,
                firstName: p.firstName,
                lastName: p.lastName,
                middleName: p.middleName,
                birthDate: p.birthDate,
                deathDate: p.deathDate,
                gender: p.gender,
                isLiving: p.isLiving,
                motherId: p.motherId,
                fatherId: p.fatherId,
            })),
            marriages: familyMarriages.map(m => ({
                id: m.id,
                person1Id: m.person1Id,
                person2Id: m.person2Id,
                marriageDate: m.marriageDate,
                divorceDate: m.divorceDate,
                location: m.location,
                marriageType: m.marriageType,
            })),
        };

        if (format === 'csv') {
            // CSV export of people data
            const headers = ['id', 'firstName', 'lastName', 'middleName', 'birthDate', 'deathDate', 'gender', 'isLiving', 'motherId', 'fatherId'];
            const rows = exportData.people.map(p =>
                headers.map(h => {
                    const val = (p as any)[h];
                    if (val === null || val === undefined) return '';
                    const str = String(val);
                    return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
                }).join(',')
            );
            const csv = [headers.join(','), ...rows].join('\n');

            setHeader(event, 'Content-Type', 'text/csv');
            setHeader(event, 'Content-Disposition', `attachment; filename="${family.familyName}-export.csv"`);
            return csv;
        }

        // Default: JSON export
        return { success: true, data: exportData };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});
