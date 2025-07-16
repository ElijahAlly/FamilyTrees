import type { PersonType } from "./person";

export type FamilyType = {
    id: number;
    family_name: string;
    members: number[];

    // Access control
    admins: number[]; // user IDs
    visibility: 'public' | 'private';
    accessCode?: string;
    
    // Collaboration
    collaborators: CollaboratorType[];
    tempAccess: TempAccessType[];
    
    // Import tracking
    importSource?: {
        platform: string;
        importedAt: Date;
        importedBy: number;
    };
    
    // Settings
    settings: {
        requireMediaApproval: boolean;
        allowMemberInvites: boolean;
        minAdminsForApproval: number;
    };
    
    createdBy: number;
    createdAt: Date;
    updatedAt: Date;
    archivedAt?: Date;
}

export type FamilyTreeNodeType = {
    member: PersonType;
    marriages: PersonType[];
    spouse: PersonType | null;
    children: FamilyTreeNodeType[];
    familyId: number;
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
    userId: number;
    role: 'viewer' | 'editor' | 'admin';
    addedBy: number;
    addedAt: Date;
}

export type TempAccessType = {
    email: string;
    accessType: 'family' | 'person';
    targetId: number; // family or person ID
    expiresAt: Date;
    maxVisits?: number;
    visitsUsed: number;
    createdBy: number;
}