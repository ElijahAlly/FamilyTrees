import type { PersonType } from "./person";

export type FamilyType = {
    id: number;
    family_name: string;
    members: number[];

    // Access control
    admins: number[]; // user IDs
    visibility: 'public' | 'private';
    access_code?: string;
    
    // Collaboration
    collaborators: CollaboratorType[];
    temp_access: TempAccessType[];
    
    // Import tracking
    import_source?: {
        platform: string;
        imported_at: string;
        imported_by: number;
    };
    
    // Settings
    settings: {
        require_media_approval: boolean;
        allow_member_invites: boolean;
        min_admins_for_approval: number;
    };
    
    created_by: number;
    created_at: string;
    updated_at: string;
    archived_at?: string;
}

export type FamilyTreeNodeType = {
    member: PersonType;
    marriages: PersonType[];
    spouse: PersonType | null;
    children: FamilyTreeNodeType[];
    family_id: number;
    level: number;
}

export const _defaultFamilyTree = {
    member: {
        id: 0,
        first_name: '',
        last_name: '',
        birth_date: '',
        death_date: null,
        gender: 'U', // not getting recognized
        mother_id: null,
        father_id: null,
        middle_name:null,
    },
    marriages: [],
    spouse: null,
    children: [],
    level: 0, 
}

export type CollaboratorType = {
    user_id: number;
    role: 'viewer' | 'editor' | 'admin';
    added_by: number;
    added_at: string;
}

export type TempAccessType = {
    email: string;
    access_type: 'family' | 'person';
    target_id: number; // family or person ID
    expires_at: string;
    max_visits?: number;
    visits_used: number;
    created_by: number;
}