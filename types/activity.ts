export type ActionType = 
  | 'ADDED_PERSON'
  | 'NAME_CHANGED'
  | 'PERSON_UPDATED'
  | 'REMOVED_PERSON'
  | 'MARRIAGE_ADDED'
  | 'MARRIAGE_UPDATED'
  | 'MARRIAGE_REMOVED'
  | 'FAMILY_UPDATED'
  | 'COLLABORATOR_ADDED'
  | 'COLLABORATOR_REMOVED';

export interface ActivityDetails {
  [key: string]: any;
  personId?: string;
  addedPerson?: string;
  updatedName?: string;
  updatedFields?: string[];
}

export interface ActivityLog {
  id: string;
  user_id: string;
  family_id: string;
  action_type: ActionType;
  details: ActivityDetails;
  created_at: string;
  user?: {
    name: string;
  };
}

export interface ActionDetails {
  action_type: ActionType;
  details: ActivityDetails;
  family_id: string;
}