export type FamilyKind = 'relatives' | 'friends';
export type MembershipStatus = 'active' | 'pending' | 'removed';

export interface FamilyMembership {
    id: string;
    kind: FamilyKind;
    status: MembershipStatus;

    userId: string;
    familyId: number;
    personId: number | null;

    joinedAt: string;
    removedAt: string | null;

    // Joined data (optional)
    familyName?: string;
    personName?: string;
}
