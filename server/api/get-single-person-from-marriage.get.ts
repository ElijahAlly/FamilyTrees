import { serverSupabaseClient } from '#supabase/server';
import { defineEventHandler, getQuery } from 'h3';

export default defineEventHandler(async (event: any) => {
    const client = await serverSupabaseClient(event)
    let { table, select, eq, spouseId } = getQuery(event);
    table = table as string;
    select = select as string;
    eq = eq as string;
    spouseId = spouseId as string;

    try {
        const { data, error } = await client.from(table).select(select).eq(eq, spouseId);
        if (error) throw error;
        return { data };
    } catch (error) {
        return { error };
    }
});
