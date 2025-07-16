import { serverSupabaseClient } from '#supabase/server';
import { defineEventHandler, getQuery } from 'h3';


export default defineEventHandler(async (event: any) => {
    const client = await serverSupabaseClient(event)
    let { table, select, memberIds } = getQuery(event);
    table = table as string;
    select = select as string;
    memberIds = memberIds as any;

    try {
        // Split the comma-separated memberIds into an array
        const ids = (memberIds as string).split(',').map(Number);
        
        const { data, error } = await client
            .from(table)
            .select(select)
            .or(`person1_id.in.(${ids}),person2_id.in.(${ids})`);

        if (error) throw error;
        return { data };
    } catch (error) {
        return { error };
    }
});