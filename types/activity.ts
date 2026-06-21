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
  | 'COLLABORATOR_REMOVED'
  | 'CLAIM_REQUESTED'
  | 'CLAIM_APPROVED'
  | 'CLAIM_DENIED'
  | 'MEMBER_JOINED'
  | 'MEMBER_REMOVED'
  | 'INVITE_CREATED'
  | 'INVITE_USED'
  | 'FAMILY_CREATED'
  | 'FAMILY_SETTINGS_UPDATED'
  | 'PRIVACY_UPDATED'
  | 'PROFILE_DELETED'
  | 'MEDIA_SUBMITTED'
  | 'MEDIA_APPROVED'
  | 'MEDIA_DENIED'
  | 'ADMIN_TRANSFERRED'
  | 'ADMIN_ADDED'
  | 'DATA_IMPORTED'
  | 'DATA_EXPORTED'
  | 'FAMILY_ARCHIVED'
  | 'FAMILY_RESTORED'
  | 'PERSON_ARCHIVED'
  | 'PERSON_RESTORED'
  | 'MERGE_REQUESTED'
  | 'MERGE_COMPLETED'
  | 'MERGE_REJECTED';

export interface ActivityDetails {
  [key: string]: any;
  personId?: string;
  addedPerson?: string;
  updatedName?: string;
  updatedFields?: string[];
  performedBy?: string;
  reason?: string;
}

export interface ActivityLog {
  id: string;
  personId?: number;
  familyId: string;
  actionType: ActionType;
  details: ActivityDetails;
  performedBy?: string;
  reason?: string;
  createdAt: string;
  user?: {
    name: string;
  };
}

export interface ActionDetails {
  actionType: ActionType;
  details: ActivityDetails;
  familyId: string;
}
