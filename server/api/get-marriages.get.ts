import { defineEventHandler, getQuery } from 'h3';
import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event: any) => {
    const client = await serverSupabaseClient(event)
    const { table, select, or } = getQuery(event);

    try {
        if (!table || typeof table !== 'string' || !select || typeof select !== 'string' || !or || typeof or !== 'string') 
            throw Error('Table, select, and or fields are required for getting marriages.');

        const { data, error } = await client.from(table).select(select).or(or);
        if (error) throw error;
        return { data };
    } catch (error) {
        return { error };
    }
});
