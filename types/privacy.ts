export interface PrivacyControls {
    familyView: boolean;
    friendsView: boolean;
    publicView: boolean;
    timeBasedRules: PrivacyTimeRule[];
    ageRestrictions: boolean;
}

export type PrivacyTimeRule = {
    group: 'family' | 'friends' | 'public';
    showAfter: Date | null;
    hideAfter: Date | null;
}
