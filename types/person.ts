import type { PrivacyControls } from "./privacy";

export type PersonType = {
    id: number;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    birth_date: string | null;
    death_date: string | null;
    is_living: boolean;
    gender: GenderType;
    mother_id: number | null;
    father_id: number | null;
    pictures: string[];

    privacySettings: PrivacyControls;

    // Claims & verification
    claimedBy: {
        userId: string;
        provider: string;
        verifiedAt: Date | null;
    } | null;

    // Additional info that only claimed person can add
    extendedInfo?: {
        email?: string;
        phone?: string;
        address?: string;
        occupation?: string;
        education?: string[];
        // etc
    };

    createdBy: number; // user ID
    updatedBy: number; // user ID
    createdAt: Date;
    updatedAt: Date;
}

export type GenderType = 'M' | 'F' | 'N' | 'U';