import type { PersonType } from "./person";

export type FamilyType = {
    id: number;
    familyName: string;
    members: number[] | null;

    // Access control
    admins: number[]; // user IDs (legacy, prefer family_roles table)
    ownerId?: string; // auth user UUID of the owner
    visibility: 'public' | 'private';
    accessCode?: string;

    // Collaboration
    collaborators: CollaboratorType[];
    tempAccess: TempAccessType[];

    // Import tracking
    importSource?: {
        platform: string;
        importedAt: string;
        importedBy: number;
    };

    // Settings
    settings: {
        requireMediaApproval: boolean;
        allowMemberInvites: boolean;
        minAdminsForApproval: number;
    };

    createdBy: number;
    createdAt: string;
    updatedAt: string;
    archivedAt?: string;
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
        firstName: '',
        lastName: '',
        birthDate: '',
        deathDate: null,
        gender: 'U', // not getting recognized
        motherId: null,
        fatherId: null,
        middleName: null,
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
    addedAt: string;
}

export type TempAccessType = {
    id: string;
    email: string;
    accessType: 'family' | 'person';
    targetId: string; // family or person ID (stored as string)
    expiresAt: string;
    maxVisits?: number | null;
    visitsUsed: number;
    createdBy: string;
    createdAt: string;
    // Enriched fields from API
    isExpired?: boolean;
    visitsExhausted?: boolean;
}