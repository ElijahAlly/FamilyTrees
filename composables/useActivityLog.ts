import type { ActivityLog, ActionType, ActivityDetails } from '~/types/activity';

export function useActivityLog() {
    const supabase = useSupabaseClient();
    
    async function logActivity(
        familyId: string, 
        actionType: ActionType, 
        details: ActivityDetails
    ) {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return null;
        
        const { data, error } = await supabase
            .from('activity_logs')
            .insert({
                user_id: user.id,
                family_id: familyId,
                action_type: actionType,
                details
            })
            .select();
        
        if (error) {
            console.error('Error logging activity:', error);
            return null;
        }
        
        return data[0] as ActivityLog;
    }
    
    async function getActivities(familyId: string, limit = 20) {
        const { data, error } = await supabase
            .from('activity_logs')
            .select(`
                id, 
                action_type, 
                details, 
                created_at,
                user_id,
                users:user_id (name)
            `)
            .eq('family_id', familyId)
            .order('created_at', { ascending: false })
            .limit(limit);
            
        if (error) {
            console.error('Error fetching activities:', error);
            return [];
        }
        
        return data as ActivityLog[];
    }
    
    return {
        logActivity,
        getActivities
    };
}