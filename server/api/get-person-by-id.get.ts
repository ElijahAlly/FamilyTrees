import { serverSupabaseClient } from '#supabase/server';
import { defineEventHandler, getQuery } from 'h3';

export default defineEventHandler(async (event: any) => {
    const client = await serverSupabaseClient(event)
    let { select, id } = getQuery(event);
    select = select as string;
    id = id as string;

    try {
        const { data, error } = await client.from("people").select(select).eq("id", id).single();
        if (error) throw error;
        return { data };
    } catch (error) {
        return { error };
    }
});