import { serverSupabaseClient } from '#supabase/server';
import { defineEventHandler, getQuery } from 'h3';

export default defineEventHandler(async (event: any) => {
    const client = await serverSupabaseClient(event)
    let { table, select, id, family_name } = getQuery(event);
    table = table as string;
    select = select as string;
    id = id as string;
    family_name = family_name as string;
    
    try {
        let query = client
            .from(table)
            .select(select)
            .eq('id', id);

        // Only add family_name condition if it's provided
        if (family_name) {
            query = query.eq('family_name', family_name);
        }

        const { data, error } = await query;
        if (error) throw error;
        return { data };
    } catch (error) {
        return { error };
    }
});