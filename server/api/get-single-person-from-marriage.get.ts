import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event)
    const { table, select, eq, spouseId } = getQuery(event);

    try {
        const { data, error } = await client.from(table).select(select).eq(eq, spouseId);
        if (error) throw error;
        return { data };
    } catch (error) {
        return { error };
    }
});
