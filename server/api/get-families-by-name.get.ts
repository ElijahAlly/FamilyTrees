import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event)
    const { table, select, eq, familyName, limit } = getQuery(event);

    try {
        let dataRes = [];
        if (!familyName || !eq) {
            const { data, error } = await client.from(table).select(select ? select : '*').limit(limit ? limit : 3);
            if (error) throw error;
            dataRes = data;
            // console.log(dataRes);

        } else  {
            const { data, error } = await client.from(table).select(select).eq(eq, familyName);
            if (error) throw error;
            dataRes = data;
        }
        return { data: dataRes };
    } catch (error) {
        return { error };
    }
});
