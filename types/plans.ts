import type { PrivacyControls } from "./privacy";

export interface Plan {
    name: PlanName;
    description: string;
    price: number;
    maxFamilyMembers: number;
    maxFamilyTrees: number; // For claiming multiple families
    maxGenerations: number;
    maxStorageGB: number;
    features: PlanFeature[];
    billingCycle: 'monthly' | 'yearly';

    // Media Features
    hasMediaUpload: boolean;
    maxMediaSizePerUpload: number; // in MB
    bulkUploadEnabled: boolean;
    mediaRequiresApproval: boolean; // For non-admin uploads
    

    // Privacy & Sharing
    privacyControls: PrivacyControls;

    // Admin & Access Control  
    maxAdmins: number;
    canInviteCollaborators: number; // max number of collaborators
    tempAccessEnabled: boolean; // For researchers/genealogists
    maxTempAccessUsers: number;

    // Import/Export
    dataImport: {
        ancestry: boolean;
        familySearch: boolean;
        gedcom: boolean;
        csv: boolean;
    };
    canExport: boolean;
    exportFormats: string[];

    // Advanced Features
    familyMergeEnabled: boolean;
    familyArchiveEnabled: boolean;
    familyAuditLog: boolean;
    disputeResolution: boolean;

    // Support
    supportLevel: 'basic' | 'priority' | 'dedicated agent';

    // Misc
    sortIds: number;
}

export interface PlanFeature {
    name: string;
    included: boolean;
    lowestTierToInclude: boolean;
    includeWhenComparing: boolean;
    limit?: number;
    details?: string;
}

export enum PlanName {
    FREE = 'FREE',
    PERSONAL = 'PERSONAL',
    FAMILY = 'FAMILY'
}

export const getPlanText = (plan: PlanName) => {
    switch (plan) {
        case PlanName.FREE: return 'Free';
        case PlanName.FAMILY: return 'Family';
        case PlanName.PERSONAL: return 'Personal'; 
        default: return 'unknown plan'
    }
}