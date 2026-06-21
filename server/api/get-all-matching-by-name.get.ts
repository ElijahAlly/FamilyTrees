import { defineEventHandler, getQuery } from 'h3';
import { db } from '../db';
import { people, families } from '../db/schema';
import { ilike, or } from 'drizzle-orm';


export default defineEventHandler(async (event) => {
    const { name, searchBy } = getQuery(event);

    if (!name || !searchBy) {
        return { error: 'name and searchBy are required' };
    }

    const nameStr = name as string;

    try {
        if (searchBy === 'people') {
            const [firstName, middleName, lastName] = nameStr.split(' ').filter((term: string) => term.length > 0);

            // Fetch all potential matches by first name, middle name, or last name
            const results = await db
                .select()
                .from(people)
                .where(
                    or(
                        ilike(people.firstName, `%${firstName}%`),
                        middleName ? ilike(people.middleName, `%${middleName}%`) : ilike(people.middleName, `%${firstName}%`),
                        lastName ? ilike(people.lastName, `%${lastName}%`) : ilike(people.lastName, `%${firstName}%`)
                    )
                );

            // Deduplicate by id
            const uniqueResults = [...new Map(results.map(r => [r.id, r])).values()];

            // Apply the same filtering logic as before
            const filteredData = uniqueResults.filter(result => {
                const resultFirstName = (result.firstName || '').toLowerCase();
                const resultMiddleName = (result.middleName || '').toLowerCase();
                const resultLastName = (result.lastName || '').toLowerCase();

                const firstNameInput = (firstName || '').toLowerCase();
                const middleNameInput = (middleName || '').toLowerCase();
                const lastNameInput = (lastName || '').toLowerCase();

                // exact match
                if (resultFirstName === firstNameInput && resultMiddleName === middleNameInput && resultLastName === lastNameInput) return true;

                // just first name match
                if (resultFirstName === firstNameInput && !middleNameInput && !lastNameInput) return true;

                // first name matches and middle name is a substring
                if (resultFirstName.includes(firstNameInput) &&
                    ((middleNameInput ? resultMiddleName.includes(middleNameInput) : true)
                        || (!lastNameInput ? resultLastName.includes(middleNameInput) : true))
                    && (lastNameInput ? resultLastName.includes(lastNameInput) : true)) return true;

                // middle and last name match as substrings when first name matches
                if (resultFirstName.includes(firstNameInput) &&
                    (middleNameInput ? resultMiddleName.includes(middleNameInput) : true)
                    && (lastNameInput ? resultLastName.includes(lastNameInput) : true)) return true;

                // middle and last name check
                if (resultMiddleName.includes(firstNameInput) && resultLastName.includes(middleNameInput)) return true;

                // first and last name exact match
                if ((resultFirstName + ' ' + resultLastName) === (firstNameInput + ' ' + lastNameInput)) return true;

                // middle and last name match
                if ((resultMiddleName + ' ' + resultLastName) === (middleNameInput + ' ' + lastNameInput)) return true;

                return false;
            });

            return { data: filteredData };

        } else if (searchBy === 'families') {
            const data = await db
                .select()
                .from(families)
                .where(ilike(families.familyName, `%${nameStr}%`));

            return { data };
        }

        return { data: [] };
    } catch (error) {
        return { error };
    }
});
