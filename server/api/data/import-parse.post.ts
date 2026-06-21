import { defineEventHandler, readBody } from 'h3';
import { db } from '../../db';
import { dataImports } from '../../db/schema';
import { requireAuth } from '../../utils/auth';
import { isAdminOrAbove } from '../../utils/permissions';

// Helper: Parse CSV string into array of objects
function parseCsv(csvString: string): Record<string, string>[] {
    const lines = csvString.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values: string[] = [];
        let current = '';
        let inQuotes = false;

        for (const char of lines[i]) {
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim());

        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
            row[h] = values[idx] || '';
        });
        rows.push(row);
    }

    return rows;
}

// Helper: Normalize field names from various sources
function normalizePersonFields(raw: Record<string, string>, source: string): any {
    // Map common field names from different platforms
    const fieldMap: Record<string, string[]> = {
        firstName: ['firstName', 'first_name', 'First Name', 'Given Name', 'given_name', 'givenName'],
        lastName: ['lastName', 'last_name', 'Last Name', 'Surname', 'surname', 'Family Name', 'familyName'],
        middleName: ['middleName', 'middle_name', 'Middle Name', 'middleNames'],
        birthDate: ['birthDate', 'birth_date', 'Birth Date', 'Date of Birth', 'dob', 'birthdate', 'born'],
        deathDate: ['deathDate', 'death_date', 'Death Date', 'Date of Death', 'dod', 'deathdate', 'died'],
        gender: ['gender', 'Gender', 'sex', 'Sex'],
        isLiving: ['isLiving', 'is_living', 'Living', 'living', 'alive', 'Alive'],
    };

    const person: any = {};

    for (const [normalKey, aliases] of Object.entries(fieldMap)) {
        for (const alias of aliases) {
            if (raw[alias] !== undefined && raw[alias] !== '') {
                person[normalKey] = raw[alias];
                break;
            }
        }
    }

    // Normalize gender to M/F/N/U
    if (person.gender) {
        const g = person.gender.toUpperCase().trim();
        if (g.startsWith('M') || g === 'MALE') person.gender = 'M';
        else if (g.startsWith('F') || g === 'FEMALE') person.gender = 'F';
        else if (g === 'N' || g === 'NON-BINARY' || g === 'NONBINARY') person.gender = 'N';
        else person.gender = 'U';
    }

    // Normalize isLiving to boolean
    if (person.isLiving !== undefined) {
        const val = String(person.isLiving).toLowerCase();
        person.isLiving = val === 'true' || val === 'yes' || val === '1' || val === 'living';
    }

    return person;
}

export default defineEventHandler(async (event) => {
    const { userId } = requireAuth(event);
    const { familyId, source, csvData, jsonData } = await readBody(event);

    if (!familyId || !source) {
        return { success: false, error: 'familyId and source are required' };
    }

    if (!csvData && !jsonData) {
        return { success: false, error: 'Either csvData or jsonData must be provided' };
    }

    try {
        // Verify user is an admin
        const hasPermission = await isAdminOrAbove(userId, Number(familyId));
        if (!hasPermission) {
            return { success: false, error: 'Only admins can import data' };
        }

        let parsedPeople: any[] = [];

        if (csvData) {
            const rows = parseCsv(csvData);
            parsedPeople = rows.map(row => normalizePersonFields(row, source));
        } else if (jsonData) {
            // Handle JSON data (e.g., from Ancestry/FamilySearch API exports)
            let data;
            try {
                data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
            } catch {
                return { success: false, error: 'Invalid JSON data' };
            }

            if (Array.isArray(data)) {
                parsedPeople = data.map(item => normalizePersonFields(item, source));
            } else if (data.people && Array.isArray(data.people)) {
                parsedPeople = data.people.map((item: any) => normalizePersonFields(item, source));
            }
        }

        // Filter out entries without at least a first name
        parsedPeople = parsedPeople.filter(p => p.firstName);

        if (parsedPeople.length === 0) {
            return { success: false, error: 'No valid person records found in the imported data' };
        }

        // Create a data import record for review
        const [importRecord] = await db
            .insert(dataImports)
            .values({
                source,
                familyId: Number(familyId),
                importedBy: userId,
                rawData: { people: parsedPeople },
                status: 'pending_review',
            })
            .returning();

        return {
            success: true,
            data: {
                importId: importRecord.id,
                peopleCount: parsedPeople.length,
                people: parsedPeople, // For review on the frontend
            },
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});
