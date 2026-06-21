import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { ApiResponse, ClaimRequest, FamilyMembership, InviteLink, TempAccessType } from '@/types';

export const useClaimsStore = defineStore('claims', () => {
    const myClaims = ref<ClaimRequest[]>([]);
    const myMemberships = ref<FamilyMembership[]>([]);
    const pendingClaimsForFamily = ref<ClaimRequest[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const hasPendingClaims = computed(() =>
        myClaims.value.some(c => c.status === 'pending')
    );

    const activeMemberships = computed(() =>
        myMemberships.value.filter(m => m.status === 'active')
    );

    const hasClaimedAnyFamily = computed(() =>
        activeMemberships.value.length > 0
    );

    // Fetch the current user's claims
    async function fetchMyClaims(userId: string) {
        try {
            loading.value = true;
            const { data } = await $fetch<ApiResponse<ClaimRequest[]>>('/api/claims/my-claims', {
                method: 'GET',
                params: { userId },
            });

            myClaims.value = data || [];
        } catch (err: any) {
            error.value = err.message || 'Failed to fetch claims';
        } finally {
            loading.value = false;
        }
    }

    // Fetch the current user's family memberships
    async function fetchMyMemberships(userId: string) {
        try {
            loading.value = true;
            const { data } = await $fetch<ApiResponse<FamilyMembership[]>>('/api/families/my-memberships', {
                method: 'GET',
                params: { userId },
            });

            myMemberships.value = data || [];
        } catch (err: any) {
            error.value = err.message || 'Failed to fetch memberships';
        } finally {
            loading.value = false;
        }
    }

    // Fetch pending claims for a family (admin view)
    async function fetchPendingClaimsForFamily(familyId: number) {
        try {
            loading.value = true;
            const { data } = await $fetch<ApiResponse<ClaimRequest[]>>('/api/claims/pending', {
                method: 'GET',
                params: { familyId },
            });

            pendingClaimsForFamily.value = data || [];
        } catch (err: any) {
            error.value = err.message || 'Failed to fetch pending claims';
        } finally {
            loading.value = false;
        }
    }

    // Submit a new claim request
    async function submitClaim(params: {
        type: ClaimRequest['type'];
        requesterId: string;
        personId?: number;
        familyId?: number;
        message?: string;
        authProvider?: string;
    }) {
        try {
            loading.value = true;
            error.value = null;

            const result = await $fetch<ApiResponse<ClaimRequest>>('/api/claims/request', {
                method: 'POST',
                body: params,
            });

            if (!result.success) {
                error.value = result.error ?? null;
                return null;
            }

            // Refresh claims
            await fetchMyClaims(params.requesterId);
            return result.data;
        } catch (err: any) {
            error.value = err.message || 'Failed to submit claim';
            return null;
        } finally {
            loading.value = false;
        }
    }

    // Review a claim (admin action)
    async function reviewClaim(params: {
        claimId: number;
        reviewerId: string;
        action: 'approve' | 'deny';
        reviewNotes?: string;
        familyId?: number;
    }) {
        try {
            loading.value = true;
            error.value = null;

            const result = await $fetch<ApiResponse>('/api/claims/review', {
                method: 'POST',
                body: params,
            });

            if (!result.success) {
                error.value = result.error ?? null;
                return null;
            }

            // Refresh pending claims if we have a familyId
            if (params.familyId) {
                await fetchPendingClaimsForFamily(params.familyId);
            }

            return result;
        } catch (err: any) {
            error.value = err.message || 'Failed to review claim';
            return null;
        } finally {
            loading.value = false;
        }
    }

    // Cancel a pending claim
    async function cancelClaim(claimId: number, userId: string) {
        try {
            loading.value = true;
            error.value = null;

            const result = await $fetch<ApiResponse>('/api/claims/cancel', {
                method: 'POST',
                body: { claimId, userId },
            });

            if (!result.success) {
                error.value = result.error ?? null;
                return false;
            }

            await fetchMyClaims(userId);
            return true;
        } catch (err: any) {
            error.value = err.message || 'Failed to cancel claim';
            return false;
        } finally {
            loading.value = false;
        }
    }

    // Create a new family
    async function createFamily(params: {
        familyName: string;
        userId: string;
        visibility?: 'public' | 'private';
        personId?: number;
    }) {
        try {
            loading.value = true;
            error.value = null;

            const result = await $fetch<ApiResponse>('/api/families/create', {
                method: 'POST',
                body: params,
            });

            if (!result.success) {
                error.value = result.error ?? null;
                return null;
            }

            // Refresh memberships
            await fetchMyMemberships(params.userId);
            return result.data;
        } catch (err: any) {
            error.value = err.message || 'Failed to create family';
            return null;
        } finally {
            loading.value = false;
        }
    }

    // Create an invite link (admin)
    async function createInviteLink(params: {
        familyId: number;
        userId: string;
        type: 'family' | 'person';
        personId?: number;
        maxUses?: number;
        expiresInDays?: number;
    }): Promise<InviteLink | null> {
        try {
            loading.value = true;
            error.value = null;

            const result = await $fetch<ApiResponse<InviteLink>>('/api/invites/create', {
                method: 'POST',
                body: params,
            });

            if (!result.success) {
                error.value = result.error ?? null;
                return null;
            }

            return result.data ?? null;
        } catch (err: any) {
            error.value = err.message || 'Failed to create invite link';
            return null;
        } finally {
            loading.value = false;
        }
    }

    // Accept an invite link
    async function acceptInvite(code: string, userId: string) {
        try {
            loading.value = true;
            error.value = null;

            const result = await $fetch<ApiResponse>('/api/invites/accept', {
                method: 'POST',
                body: { code, userId },
            });

            if (!result.success) {
                error.value = result.error ?? null;
                return null;
            }

            await fetchMyClaims(userId);
            return result;
        } catch (err: any) {
            error.value = err.message || 'Failed to accept invite';
            return null;
        } finally {
            loading.value = false;
        }
    }

    // === Admin Management ===

    async function manageAdmin(params: {
        familyId: number;
        userId: string;
        action: 'add_admin' | 'remove_admin' | 'transfer_admin';
        targetUserId: string;
    }) {
        try {
            loading.value = true;
            error.value = null;

            const result = await $fetch<ApiResponse>('/api/families/manage-admins', {
                method: 'POST',
                body: params,
            });

            if (!result.success) {
                error.value = result.error ?? null;
                return null;
            }

            return result.data;
        } catch (err: any) {
            error.value = err.message || 'Failed to manage admin';
            return null;
        } finally {
            loading.value = false;
        }
    }

    // Fetch family members (admin view)
    async function fetchFamilyMembers(familyId: number, userId: string) {
        try {
            loading.value = true;
            const result = await $fetch<ApiResponse>('/api/families/members', {
                method: 'GET',
                params: { familyId, userId },
            });

            if (!result.success) {
                error.value = result.error ?? null;
                return [];
            }

            return result.data || [];
        } catch (err: any) {
            error.value = err.message || 'Failed to fetch family members';
            return [];
        } finally {
            loading.value = false;
        }
    }

    // === Bulk Invite ===

    async function bulkCreateInviteLinks(params: {
        familyId: number;
        userId: string;
        count: number;
        maxUsesPerLink?: number;
        expiresInDays?: number;
    }): Promise<InviteLink[] | null> {
        try {
            loading.value = true;
            error.value = null;

            const result = await $fetch<ApiResponse<InviteLink[]>>('/api/invites/bulk-create', {
                method: 'POST',
                body: params,
            });

            if (!result.success) {
                error.value = result.error ?? null;
                return null;
            }

            return result.data ?? null;
        } catch (err: any) {
            error.value = err.message || 'Failed to create bulk invite links';
            return null;
        } finally {
            loading.value = false;
        }
    }

    // === Temp Access ===

    async function createTempAccess(params: {
        familyId: number;
        userId: string;
        email: string;
        accessType: 'family' | 'person';
        personId?: number;
        expiresInDays?: number;
        maxVisits?: number;
    }) {
        try {
            loading.value = true;
            error.value = null;

            const result = await $fetch<ApiResponse<TempAccessType>>('/api/temp-access/create', {
                method: 'POST',
                body: params,
            });

            if (!result.success) {
                error.value = result.error ?? null;
                return null;
            }

            return result.data;
        } catch (err: any) {
            error.value = err.message || 'Failed to create temporary access';
            return null;
        } finally {
            loading.value = false;
        }
    }

    async function fetchTempAccessList(familyId: number, userId: string) {
        try {
            loading.value = true;
            const result = await $fetch<ApiResponse<TempAccessType[]>>('/api/temp-access/list', {
                method: 'GET',
                params: { familyId, userId },
            });

            if (!result.success) {
                error.value = result.error ?? null;
                return [];
            }

            return result.data || [];
        } catch (err: any) {
            error.value = err.message || 'Failed to fetch temp access list';
            return [];
        } finally {
            loading.value = false;
        }
    }

    async function revokeTempAccess(params: {
        tempAccessId: string;
        familyId: number;
        userId: string;
    }) {
        try {
            loading.value = true;
            error.value = null;

            const result = await $fetch<ApiResponse>('/api/temp-access/revoke', {
                method: 'POST',
                body: params,
            });

            if (!result.success) {
                error.value = result.error ?? null;
                return null;
            }

            return result.data;
        } catch (err: any) {
            error.value = err.message || 'Failed to revoke temporary access';
            return null;
        } finally {
            loading.value = false;
        }
    }

    // === Data Export ===

    async function exportFamilyData(familyId: number, userId: string, format: 'json' | 'csv' = 'json') {
        try {
            loading.value = true;
            error.value = null;

            if (format === 'csv') {
                const csv = await $fetch('/api/data/export', {
                    method: 'GET',
                    params: { familyId, userId, format: 'csv' },
                    responseType: 'text',
                }) as string;
                return csv;
            }

            const result = await $fetch<ApiResponse>('/api/data/export', {
                method: 'GET',
                params: { familyId, userId, format: 'json' },
            });

            if (!result.success) {
                error.value = result.error ?? null;
                return null;
            }

            return result.data;
        } catch (err: any) {
            error.value = err.message || 'Failed to export data';
            return null;
        } finally {
            loading.value = false;
        }
    }

    // === Data Import ===

    async function parseImportData(params: {
        familyId: number;
        userId: string;
        source: string;
        csvData?: string;
        jsonData?: any;
    }) {
        try {
            loading.value = true;
            error.value = null;

            const result = await $fetch<ApiResponse>('/api/data/import-parse', {
                method: 'POST',
                body: params,
            });

            if (!result.success) {
                error.value = result.error ?? null;
                return null;
            }

            return result.data;
        } catch (err: any) {
            error.value = err.message || 'Failed to parse import data';
            return null;
        } finally {
            loading.value = false;
        }
    }

    async function confirmImport(params: {
        importId: number;
        familyId: number;
        userId: string;
        reviewedPeople: any[];
    }) {
        try {
            loading.value = true;
            error.value = null;

            const result = await $fetch<ApiResponse>('/api/data/import-confirm', {
                method: 'POST',
                body: params,
            });

            if (!result.success) {
                error.value = result.error ?? null;
                return null;
            }

            return result.data;
        } catch (err: any) {
            error.value = err.message || 'Failed to confirm import';
            return null;
        } finally {
            loading.value = false;
        }
    }

    // === Merge Families ===

    async function requestMerge(params: {
        sourceFamilyId: number;
        targetFamilyId: number;
        userId: string;
        mergeNotes?: string;
    }) {
        try {
            loading.value = true;
            error.value = null;

            const result = await $fetch<ApiResponse>('/api/data/merge-request', {
                method: 'POST',
                body: params,
            });

            if (!result.success) {
                error.value = result.error ?? null;
                return null;
            }

            return result.data;
        } catch (err: any) {
            error.value = err.message || 'Failed to request merge';
            return null;
        } finally {
            loading.value = false;
        }
    }

    async function fetchMergeRequests(familyId: number, userId: string) {
        try {
            loading.value = true;
            const result = await $fetch<ApiResponse>('/api/data/merge-list', {
                method: 'GET',
                params: { familyId, userId },
            });

            if (!result.success) {
                error.value = result.error ?? null;
                return [];
            }

            return result.data || [];
        } catch (err: any) {
            error.value = err.message || 'Failed to fetch merge requests';
            return [];
        } finally {
            loading.value = false;
        }
    }

    async function resolveMerge(params: {
        mergeRequestId: number;
        userId: string;
        action: 'approve' | 'reject';
        resolutions?: Record<string, Record<string, any>>;
    }) {
        try {
            loading.value = true;
            error.value = null;

            const result = await $fetch<ApiResponse>('/api/data/merge-resolve', {
                method: 'POST',
                body: params,
            });

            if (!result.success) {
                error.value = result.error ?? null;
                return null;
            }

            return result.data;
        } catch (err: any) {
            error.value = err.message || 'Failed to resolve merge';
            return null;
        } finally {
            loading.value = false;
        }
    }

    // === Archive / Delete ===

    async function archiveFamily(familyId: number, userId: string, action: 'archive' | 'restore') {
        try {
            loading.value = true;
            error.value = null;

            const result = await $fetch<ApiResponse>('/api/data/archive-family', {
                method: 'POST',
                body: { familyId, userId, action },
            });

            if (!result.success) {
                error.value = result.error ?? null;
                return null;
            }

            return result.data;
        } catch (err: any) {
            error.value = err.message || `Failed to ${action} family`;
            return null;
        } finally {
            loading.value = false;
        }
    }

    async function archivePerson(params: {
        personId: number;
        familyId?: number;
        userId: string;
        action: 'archive' | 'restore';
    }) {
        try {
            loading.value = true;
            error.value = null;

            const result = await $fetch<ApiResponse>('/api/data/archive-person', {
                method: 'POST',
                body: params,
            });

            if (!result.success) {
                error.value = result.error ?? null;
                return null;
            }

            return result.data;
        } catch (err: any) {
            error.value = err.message || `Failed to ${params.action} person`;
            return null;
        } finally {
            loading.value = false;
        }
    }

    function clearStore() {
        myClaims.value = [];
        myMemberships.value = [];
        pendingClaimsForFamily.value = [];
        loading.value = false;
        error.value = null;
    }

    return {
        myClaims,
        myMemberships,
        pendingClaimsForFamily,
        loading,
        error,
        hasPendingClaims,
        activeMemberships,
        hasClaimedAnyFamily,
        fetchMyClaims,
        fetchMyMemberships,
        fetchPendingClaimsForFamily,
        submitClaim,
        reviewClaim,
        cancelClaim,
        createFamily,
        createInviteLink,
        acceptInvite,
        manageAdmin,
        fetchFamilyMembers,
        bulkCreateInviteLinks,
        createTempAccess,
        fetchTempAccessList,
        revokeTempAccess,
        exportFamilyData,
        parseImportData,
        confirmImport,
        requestMerge,
        fetchMergeRequests,
        resolveMerge,
        archiveFamily,
        archivePerson,
        clearStore,
    };
}, {
    persist: {
        key: 'claims',
        pick: [
            'myClaims',
            'myMemberships',
        ],
    },
});
