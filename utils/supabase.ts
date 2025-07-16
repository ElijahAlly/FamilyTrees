import type { ActionType, ActivityDetails, ActionDetails } from '~/types/activity';

/**
 * Generates a public URL for a person's picture in Supabase storage
 * @param familyId - The family ID
 * @param personId - The person ID
 * @param filename - The filename with extension
 * @returns The complete public URL for the image
 */
export const getPersonPictureUrl = (familyId: number, personId: number, filename: string) => {
    const supabaseUrl = useRuntimeConfig().public.supabaseUrl;
    const path = `people/${familyId}/${personId}/${filename}`;
    return `${supabaseUrl}/storage/v1/object/public/${path}`;
};

export const customSupabaseFetch = () => {
    return async (url: string, options: RequestInit = {}): Promise<Response> => {
        // Execute the original request
        const response = await fetch(url, options);
        
        // Clone the response to avoid consuming it
        const clonedResponse = response.clone();
        
        // Only log POST, PATCH, PUT, DELETE requests (NOT GET)
        if (options.method && options.method !== 'GET') {
            try {
                // Extract table name from URL
                const urlParts = new URL(url).pathname.split('/');
                const tableName = urlParts[urlParts.length - 1];
                
                // Only log specific tables
                const trackedTables = ['families', 'marriages', 'people', 'collaborators'];
                
                if (trackedTables.includes(tableName)) {
                    // Get Supabase client
                    const supabase = useSupabaseClient();
                    
                    // Get user info
                    const { data: { user } } = await supabase.auth.getUser();
                    
                    if (user) {
                        // Parse request body
                        const requestBody = options.body ? JSON.parse(options.body as string) : {};
                        
                        // Parse response data
                        const responseData = await clonedResponse.json();
                        
                        // Determine action details via below helper
                        const actionDetails = determineActionDetails(
                            tableName, 
                            options.method, 
                            requestBody,
                            responseData
                        );
                        
                        if (actionDetails && actionDetails.family_id) {
                            // Log the activity
                            await supabase.from('activity_logs').insert({
                                user_id: user.id,
                                family_id: actionDetails.family_id,
                                action_type: actionDetails.action_type,
                                details: actionDetails.details
                            });
                        }
                    }
                }
            } catch (error) {
                console.error('Error logging activity:', error);
            }
        }
        
        return response;
    };
}

// Helper function to determine action details
const determineActionDetails = (
    table: string, 
    method: string, 
    requestBody: any, 
    responseData: any
): ActionDetails | null => {
    let actionType: ActionType | null = null;
    let details: ActivityDetails = {};
    let family_id = requestBody.family_id;
    
    switch (table) {
        case 'people':
        if (method === 'POST') {
            actionType = 'ADDED_PERSON';
            details = { 
                addedPerson: requestBody.name,
                personId: responseData[0]?.id
            };
        } else if (method === 'PATCH' || method === 'PUT') {
            if (requestBody.name) {
                actionType = 'NAME_CHANGED';
                details = { 
                    updatedName: requestBody.name,
                    personId: requestBody.id
                };
            } else {
                actionType = 'PERSON_UPDATED';
                details = { 
                    personId: requestBody.id,
                    updatedFields: Object.keys(requestBody).filter(k => k !== 'id')
                };
            }
        } else if (method === 'DELETE') {
            actionType = 'REMOVED_PERSON';
            details = { 
                personId: requestBody.id
            };
        }
        break;
        
        case 'marriages':
        if (method === 'POST') {
            actionType = 'MARRIAGE_ADDED';
            details = {
                person1Id: requestBody.person1_id,
                person2Id: requestBody.person2_id
            };
        } else if (method === 'PATCH' || method === 'PUT') {
            actionType = 'MARRIAGE_UPDATED';
            details = {
                marriageId: requestBody.id,
                updatedFields: Object.keys(requestBody).filter(k => k !== 'id')
            };
        } else if (method === 'DELETE') {
            actionType = 'MARRIAGE_REMOVED';
            details = {
                marriageId: requestBody.id
            };
        }
        break;
        
        case 'families':
        if (method === 'PATCH' || method === 'PUT') {
            actionType = 'FAMILY_UPDATED';
            details = {
                familyId: requestBody.id,
                updatedFields: Object.keys(requestBody).filter(k => k !== 'id')
            };
            family_id = requestBody.id;
        }
        break;
        
        case 'collaborators':
        if (method === 'POST') {
            actionType = 'COLLABORATOR_ADDED';
            details = {
                email: requestBody.email,
                role: requestBody.role
            };
        } else if (method === 'DELETE') {
            actionType = 'COLLABORATOR_REMOVED';
            details = {
                collaboratorId: requestBody.id
            };
        }
        break;
    }
    
    if (!actionType || !family_id) return null;
    
    return { 
        action_type: actionType, 
        details, 
        family_id 
    };
}