import { serverSupabaseClient } from '#supabase/server';
import { defineEventHandler, getQuery } from 'h3';

export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event)
    const { familyName, id } = getQuery(event);

    try {
        const { data, error } = await client.from('families').select('*').eq('family_name', familyName).contains('members', [id]);
        if (error) throw error;
        return { data };
    } catch (error) {
        return { error };
    }
});