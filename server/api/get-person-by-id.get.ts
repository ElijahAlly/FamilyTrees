import { serverSupabaseClient } from '#supabase/server';
import { defineEventHandler, getQuery } from 'h3';

export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event)
    const { select, id } = getQuery(event);

    try {
        const { data, error } = await client.from("people").select(select).eq("id", id);
        if (error) throw error;
        return { data };
    } catch (error) {
        return { error };
    }
});