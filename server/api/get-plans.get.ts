import { serverSupabaseClient } from '#supabase/server';
import { defineEventHandler, getQuery } from 'h3';

export default defineEventHandler(async (event: any) => {
    const client = await serverSupabaseClient(event);
    let { select, id } = getQuery(event);
    select = select as string;
    id = id as string;

    try {
        let data = null;
        let error = null;

        if (id && select) {
            const { data: singlePlan, error: singleError } = await client
                .from('plans')
                .select(select)
                .eq("id", id);
            
            data = singlePlan;
            error = singleError;
        } else {
            const { data: allPlans, error: allError } = await client
                .from('plans')
                .select('*')
                .order('sort_ids', { ascending: true });
            
            data = allPlans;
            error = allError;
        }
        if (error) throw error;
        return { data };
    } catch (error) {
        return { error };
    }
});