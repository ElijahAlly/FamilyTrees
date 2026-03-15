export type MediaSubmissionStatus = 'pending' | 'approved' | 'denied';

export interface MediaSubmission {
    id: number;
    mediaUrl: string;
    caption: string | null;
    status: MediaSubmissionStatus;

    familyId: number;
    submittedBy: string;
    reviewedBy: string | null;

    createdAt: string;
    reviewedAt: string | null;

    // Joined data (optional)
    submitterName?: string;
}
