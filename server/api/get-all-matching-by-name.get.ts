import { serverSupabaseClient } from '#supabase/server';
import { defineEventHandler, getQuery } from 'h3';

export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event)
    const { table, select, ilike, name, searchBy } = getQuery(event);

    try {
        if (searchBy === 'people' && name) {
            const [firstName, middleName, lastName] = (name as string).split(' ').filter((term: string) => term.length > 0);
            const { data: firstNameResults, firstNameError } = await client
                .from(table)
                .select(select)
                .or(`first_name.ilike.%${firstName}%`);

            if (firstNameError) throw firstNameError;
            if (!middleName && !lastName && firstNameResults.length) return { data: firstNameResults};

            let middleNameResults = [];
            if (firstNameResults.length) {
                const { data, middleNameError } = await client
                    .from(table)
                    .select(select)
                    .or(`middle_name.ilike.%${middleName}%`)
                    .not('id', 'in', `(${firstNameResults.map((result: any) => result.id).join(',')})`);

                if (middleNameError) throw middleNameError;
                middleNameResults = data;
            } else {
                const { data, middleNameError } = await client
                    .from(table)
                    .select(select)
                    .or(`middle_name.ilike.%${firstName}%`);

                if (middleNameError) throw middleNameError;
                if (!middleName && !lastName && data.length) return { data };
                middleNameResults = data;
            }

            let lastNameResults = [];

            if (middleNameResults.length || firstNameResults.length) {
                const { data, lastNameError } = await client
                    .from(table)
                    .select(select)
                    .or(`last_name.ilike.%${lastName}%`)
                    .not('id', 'in', `(${[...firstNameResults, ...middleNameResults].map((result: any) => result.id).join(',')})`);
                
                if (lastNameError) throw lastNameError;
                lastNameResults = data;
            } else {
                const { data, lastNameError } = await client
                    .from(table)
                    .select(select)
                    .or(`last_name.ilike.%${firstName}%`);

                if (lastNameError) throw lastNameError;
                if (!middleName && !lastName && data.length) return { data };
                lastNameResults = data;
            }

            const results = [...firstNameResults, ...middleNameResults, ...lastNameResults];
            
            const filteredData = results.filter(result => {
                const first_name = (result.first_name || '').toLowerCase();
                const middle_name = (result.middle_name || '').toLowerCase();
                const last_name = (result.last_name || '').toLowerCase();

                const firstNameInput = (firstName || '').toLowerCase();
                const middleNameInput = (middleName || '').toLowerCase();
                const lastNameInput = (lastName || '').toLowerCase();

                // exact match
                const check1: boolean = (first_name === firstNameInput) 
                    && (middle_name === middleNameInput)
                    && (last_name === lastNameInput);
                if (check1) return true;

                // just first name match (and middle and last name inputs are empty)
                const check2: boolean = (first_name === firstNameInput && !middleNameInput && !lastNameInput);
                if (check2) return true;

                // first name matches and middle name is a substring
                const check3: boolean = first_name.includes(firstNameInput) &&
                    ((middleNameInput ? middle_name.includes(middleNameInput) : true) 
                        || (!lastNameInput ? last_name.includes(middleNameInput) : true)) 
                    && (lastNameInput ? last_name.includes(lastNameInput) : true);
                if (check3) return true;

                // middle and last name match as substrings when first name matches
                const check4: boolean = first_name.includes(firstNameInput) &&
                    (middleNameInput ? middle_name.includes(middleNameInput) : true) 
                    && (lastNameInput ? last_name.includes(lastNameInput) : true);
                if (check4) return true;
                
                // middle and last name check
                const check5: boolean = middle_name.includes(firstNameInput) && last_name.includes(middleNameInput);
                if (check5) return true;

                // first and last name exact match
                const check6: boolean = (first_name + ' ' + last_name) === (firstNameInput + ' ' + lastNameInput);
                if (check6) return true;

                // middle and last name match
                const check7: boolean = (middle_name + ' ' + last_name) === (middleNameInput + ' ' + lastNameInput);
                if (check7) return true;

                return false;
            })

            return { data: filteredData };
        } else if (searchBy === 'families') {
            const { data, error } = await client
                .from(table)
                .select(select)
                .ilike(ilike, `%${name}%`);

            if (error) throw error;
            return { data };
        }
    } catch (error) {
        return { error };
    }
});
