export type InviteType = 'family' | 'person';

export interface InviteLink {
    id: string;
    type: InviteType;
    code: string;
    isActive: boolean;
    maxUses: number | null;
    usesCount: number;
    expiresAt: string | null;
    createdAt: string;

    familyId: number;
    personId: number | null;
    createdBy: string;

    // Joined data (optional)
    familyName?: string;
    personName?: string;
}
