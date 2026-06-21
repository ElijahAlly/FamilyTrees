export interface PrivacyControls {
    familyView: boolean;
    friendsView: boolean;
    publicView: boolean;
    timeBasedRules: PrivacyTimeRule[];
    ageRestrictions: AgeRestriction | null;
    requireSameLastName: boolean;
}

export type PrivacyTimeRule = {
    group: 'family' | 'friends' | 'public';
    showAfter: Date | null;
    hideAfter: Date | null;
}

export type AgeRestriction = {
    minAge: number;
    restrictedFields: string[];
}

export type ViewType = 'private' | 'family' | 'friends' | 'public';
