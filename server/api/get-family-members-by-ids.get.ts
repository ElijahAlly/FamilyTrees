import { serverSupabaseClient } from '#supabase/server';
import { defineEventHandler, getQuery } from 'h3';

export default defineEventHandler(async (event: any) => {
    const client = await serverSupabaseClient(event)
    let { table, select, column, ids } = getQuery(event);
    table = table as string;
    select = select as string;
    column = column as string;

    try {
        const { data, error } = await client.from(table).select(select).in(column, ids as any);
        if (error) throw error;
        return { data };
    } catch (error) {
        return { error };
    }
});
