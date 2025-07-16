import { serverSupabaseClient } from '#supabase/server';
import { defineEventHandler, getQuery } from 'h3';

export default defineEventHandler(async (event: any) => {
    const client = await serverSupabaseClient(event)
    let { table, select, eq, familyName, limit } = getQuery(event);
    table = table as string;
    select = select as string;
    eq = eq as string;
    familyName = familyName as string;
    limit = limit as number;

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
