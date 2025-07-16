import { serverSupabaseClient } from '#supabase/server';
import { defineEventHandler, getQuery } from 'h3';

export default defineEventHandler(async (event: any) => {
    const client = await serverSupabaseClient(event)
    let { familyName, id } = getQuery(event);
    familyName = familyName as string;
    id = id as string;

    try {
        const { data, error } = await client.from('families').select('*').eq('family_name', familyName).contains('members', [id]);
        if (error) throw error;
        return { data };
    } catch (error) {
        return { error };
    }
});