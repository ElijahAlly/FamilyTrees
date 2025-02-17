import { serverSupabaseClient } from '#supabase/server';
import { defineEventHandler, getQuery } from 'h3';

export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event)
    const { table, select, eq, id } = getQuery(event);

    try {
        const { data, error } = await client.from(table).select(select).eq(eq, id);
        if (error) throw error;
        return { data };
    } catch (error) {
        return { error };
    }
});
