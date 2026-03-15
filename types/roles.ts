export type FamilyRole = 'owner' | 'banker' | 'admin' | 'member' | 'guest';
export type AgeLabel = 'child' | 'teenager' | 'adult';

export interface FamilyRoleRecord {
    id: string;
    familyId: number;
    userId: string;
    role: FamilyRole;
    assignedBy: string | null;
    assignedAt: string;
    updatedAt: string;
}

export const ROLE_HIERARCHY: Record<FamilyRole, number> = {
    owner: 5,
    banker: 4,
    admin: 3,
    member: 2,
    guest: 1,
};
