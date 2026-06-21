export type ClaimRequestStatus = 'pending' | 'approved' | 'denied' | 'cancelled';
export type ClaimRequestType = 'claim_person' | 'join_family' | 'add_self_to_family';

export interface ClaimRequest {
    id: number;
    type: ClaimRequestType;
    status: ClaimRequestStatus;
    message: string | null;
    reviewNotes: string | null;
    authProvider: string | null;
    requiredApprovals: number;
    currentApprovals: number;
    reviewedBy: string[];

    requesterId: string;
    personId: number | null;
    familyId: number | null;

    createdAt: string;
    updatedAt: string;
    resolvedAt: string | null;

    // Joined data (optional, populated by API)
    requesterName?: string;
    requesterEmail?: string;
    personName?: string;
    familyName?: string;
}
