import type { ActivityLog, ActionType, ActivityDetails } from '~/types/activity';

export function useActivityLog() {
    async function logActivity(
        familyId: number,
        personId: number,
        actionType: ActionType,
        details: ActivityDetails,
        performedBy?: string,
        reason?: string,
    ) {
        try {
            const { data, error } = await $fetch('/api/log-activity', {
                method: 'POST',
                body: {
                    personId,
                    familyId,
                    actionType,
                    details,
                    performedBy,
                    reason,
                }
            }) as any;

            if (error) {
                console.error('Error logging activity:', error);
                return null;
            }

            return data as ActivityLog;
        } catch (err) {
            console.error('Error logging activity:', err);
            return null;
        }
    }

    async function getActivities(familyId: number, limit = 20) {
        try {
            const { data, error } = await $fetch('/api/get-activities', {
                method: 'GET',
                params: { familyId, limit }
            }) as any;

            if (error) {
                console.error('Error fetching activities:', error);
                return [];
            }

            return data as ActivityLog[];
        } catch (err) {
            console.error('Error fetching activities:', err);
            return [];
        }
    }

    return {
        logActivity,
        getActivities
    };
}
