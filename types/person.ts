import type { PrivacyControls } from "./privacy";

export type PersonType = {
    id: number;
    firstName: string;
    middleName: string | null;
    lastName: string;
    birthDate: string | null;
    deathDate: string | null;
    isLiving: boolean;
    gender: GenderType;
    motherId: number | null;
    fatherId: number | null;
    pictures: string[];
    profilePicture?: string;

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

    onboardingCompleted?: boolean;

    preferences?: UserPreferences;

    createdBy: number; // user ID
    updatedBy: number; // user ID
    createdAt: Date;
    updatedAt: Date;
}

export type GenderType = 'M' | 'F' | 'N' | 'U';

export interface UserPreferences {
    hotkeyHintDismissed?: boolean;
}