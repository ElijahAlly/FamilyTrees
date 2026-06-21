<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Icon } from '@iconify/vue';
import type { ClaimRequest } from '@/types';

const authStore = useAuthStore();
const claimsStore = useClaimsStore();
const { user } = storeToRefs(authStore);
const { myClaims, loading } = storeToRefs(claimsStore);

// Track user roles per family for approve/deny capability
const familyRoles = ref<Record<number, string | null>>({});
const reviewingClaimId = ref<number | null>(null);
const reviewNotesMap = ref<Record<number, string>>({});

onMounted(async () => {
    if (user.value) {
        await claimsStore.fetchMyClaims(user.value.id);
        await fetchRolesForClaims();
    }
});

const fetchRolesForClaims = async () => {
    if (!user.value) return;

    // Get unique family IDs from pending claims
    const familyIds = [...new Set(
        myClaims.value
            .filter(c => c.familyId && c.status === 'pending')
            .map(c => c.familyId!)
    )];

    for (const familyId of familyIds) {
        try {
            const result = await $fetch('/api/roles/get-role', {
                method: 'GET',
                params: { familyId },
            }) as any;
            familyRoles.value[familyId] = result.data?.role || null;
        } catch {
            familyRoles.value[familyId] = null;
        }
    }
};

const canReview = (claim: ClaimRequest) => {
    if (claim.status !== 'pending' || !claim.familyId) return false;
    const role = familyRoles.value[claim.familyId];
    if (!role) return false;
    return ['owner', 'banker', 'admin'].includes(role);
};

const handleCancel = async (claimId: number) => {
    if (!user.value) return;
    await claimsStore.cancelClaim(claimId, user.value.id);
};

const handleReview = async (claimId: number, action: 'approve' | 'deny', familyId: number) => {
    if (!user.value) return;

    reviewingClaimId.value = claimId;

    await claimsStore.reviewClaim({
        claimId,
        reviewerId: user.value.id,
        action,
        reviewNotes: reviewNotesMap.value[claimId] || undefined,
        familyId,
    });

    reviewingClaimId.value = null;
    delete reviewNotesMap.value[claimId];

    // Refresh claims to update status
    await claimsStore.fetchMyClaims(user.value.id);
};

const statusConfig: Record<string, { color: string; icon: string }> = {
    pending: { color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20', icon: 'mdi:clock-outline' },
    approved: { color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20', icon: 'mdi:check-circle' },
    denied: { color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20', icon: 'mdi:close-circle' },
    cancelled: { color: 'text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800', icon: 'mdi:cancel' },
};

const getTypeLabel = (type: string) => {
    switch (type) {
        case 'claim_person': return 'Claim Person';
        case 'join_family': return 'Join Family';
        case 'add_self_to_family': return 'Add Self';
        default: return type;
    }
};
</script>

<template>
    <div class="w-full">
        <h3 class="text-lg font-semibold dark:text-white mb-3 flex items-center gap-2">
            <Icon icon="mdi:clipboard-list" class="w-5 h-5" />
            My Requests
        </h3>

        <div v-if="loading" class="text-zinc-500 dark:text-zinc-400 text-sm py-4">
            Loading...
        </div>

        <div v-else-if="myClaims.length === 0" class="text-zinc-500 dark:text-zinc-400 text-sm py-4">
            You haven't made any requests yet.
        </div>

        <div v-else class="space-y-2">
            <div
                v-for="claim in myClaims"
                :key="claim.id"
                class="border dark:border-zinc-700 rounded-lg p-3"
            >
                <div class="flex justify-between items-start">
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                            <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                                {{ getTypeLabel(claim.type) }}
                            </span>
                            <span :class="['text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1', statusConfig[claim.status]?.color]">
                                <Icon :icon="statusConfig[claim.status]?.icon" class="w-3 h-3" />
                                {{ claim.status }}
                            </span>
                        </div>
                        <p v-if="claim.familyName" class="text-sm dark:text-white">
                            Family: <strong>{{ claim.familyName }}</strong>
                        </p>
                        <p v-if="claim.personName" class="text-sm dark:text-white">
                            Person: <strong>{{ claim.personName }}</strong>
                        </p>
                    </div>
                    <span class="text-xs text-zinc-400">{{ new Date(claim.createdAt).toLocaleDateString() }}</span>
                </div>

                <!-- Request message -->
                <p v-if="claim.message" class="text-sm text-zinc-600 dark:text-zinc-300 mt-2 italic border-l-2 border-zinc-300 dark:border-zinc-600 pl-2">
                    "{{ claim.message }}"
                </p>

                <p v-if="claim.reviewNotes" class="text-xs text-zinc-500 dark:text-zinc-400 mt-2 italic">
                    Admin note: "{{ claim.reviewNotes }}"
                </p>

                <!-- Approve/Deny section for admins/owners -->
                <div v-if="canReview(claim) && claim.familyId" class="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
                    <p class="text-xs text-zinc-500 dark:text-zinc-400 mb-2 flex items-center gap-1">
                        <Icon icon="mdi:shield-check" class="w-3.5 h-3.5" />
                        You can review this request as {{ familyRoles[claim.familyId] }}
                    </p>

                    <input
                        v-model="reviewNotesMap[claim.id]"
                        class="w-full border dark:border-zinc-600 rounded p-2 text-sm dark:bg-zinc-800 dark:text-white mb-2"
                        placeholder="Review notes (optional)"
                    />

                    <div class="flex gap-2">
                        <button
                            @click="handleReview(claim.id, 'approve', claim.familyId)"
                            :disabled="reviewingClaimId === claim.id"
                            class="flex-1 px-3 py-1.5 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
                        >
                            <Icon icon="mdi:check" class="w-4 h-4" />
                            {{ reviewingClaimId === claim.id ? '...' : 'Approve' }}
                        </button>
                        <button
                            @click="handleReview(claim.id, 'deny', claim.familyId)"
                            :disabled="reviewingClaimId === claim.id"
                            class="flex-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
                        >
                            <Icon icon="mdi:close" class="w-4 h-4" />
                            {{ reviewingClaimId === claim.id ? '...' : 'Deny' }}
                        </button>
                    </div>
                </div>

                <button
                    v-if="claim.status === 'pending' && !canReview(claim)"
                    @click="handleCancel(claim.id)"
                    class="mt-2 text-xs text-red-500 hover:text-red-700 dark:hover:text-red-300 underline"
                >
                    Cancel request
                </button>

                <!-- Show cancel alongside review buttons too -->
                <button
                    v-if="claim.status === 'pending' && canReview(claim)"
                    @click="handleCancel(claim.id)"
                    class="mt-2 text-xs text-red-500 hover:text-red-700 dark:hover:text-red-300 underline"
                >
                    Cancel request
                </button>
            </div>
        </div>
    </div>
</template>
