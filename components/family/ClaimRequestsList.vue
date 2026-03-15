<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { Icon } from '@iconify/vue';
import type { ClaimRequest } from '@/types';

const props = defineProps<{
    familyId: number;
}>();

const authStore = useAuthStore();
const claimsStore = useClaimsStore();
const { user } = storeToRefs(authStore);
const { pendingClaimsForFamily, loading } = storeToRefs(claimsStore);

const reviewingClaimId = ref<number | null>(null);
const reviewNotes = ref('');

onMounted(async () => {
    if (props.familyId) {
        await claimsStore.fetchPendingClaimsForFamily(props.familyId);
    }
});

const handleReview = async (claimId: number, action: 'approve' | 'deny') => {
    if (!user.value) return;

    reviewingClaimId.value = claimId;

    await claimsStore.reviewClaim({
        claimId,
        reviewerId: user.value.id,
        action,
        reviewNotes: reviewNotes.value || undefined,
        familyId: props.familyId,
    });

    reviewingClaimId.value = null;
    reviewNotes.value = '';
};

const getTypeLabel = (type: ClaimRequest['type']) => {
    switch (type) {
        case 'claim_person': return 'Claim Person';
        case 'join_family': return 'Join Family';
        case 'add_self_to_family': return 'Add Self to Family';
        default: return type;
    }
};
</script>

<template>
    <div class="w-full">
        <h3 class="text-lg font-semibold dark:text-white mb-3 flex items-center gap-2">
            <Icon icon="mdi:account-clock" class="w-5 h-5" />
            Pending Requests
            <span v-if="pendingClaimsForFamily.length" class="text-sm bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-full">
                {{ pendingClaimsForFamily.length }}
            </span>
        </h3>

        <div v-if="loading" class="text-zinc-500 dark:text-zinc-400 text-sm py-4">
            Loading requests...
        </div>

        <div v-else-if="pendingClaimsForFamily.length === 0" class="text-zinc-500 dark:text-zinc-400 text-sm py-4">
            No pending requests.
        </div>

        <div v-else class="space-y-3">
            <div
                v-for="claim in pendingClaimsForFamily"
                :key="claim.id"
                class="border dark:border-zinc-700 rounded-lg p-4"
            >
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                            {{ getTypeLabel(claim.type) }}
                        </span>
                        <p class="dark:text-white mt-2 font-medium">
                            {{ claim.requesterName || claim.requesterEmail || 'Unknown' }}
                        </p>
                        <p v-if="claim.personName" class="text-sm text-zinc-500 dark:text-zinc-400">
                            Claiming: {{ claim.personName }}
                        </p>
                    </div>
                    <div class="text-xs text-zinc-400">
                        {{ new Date(claim.createdAt).toLocaleDateString() }}
                    </div>
                </div>

                <p v-if="claim.authProvider" class="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                    Auth provider: <span class="font-mono">{{ claim.authProvider }}</span>
                </p>

                <p v-if="claim.message" class="text-sm text-zinc-600 dark:text-zinc-300 mb-3 italic border-l-2 border-zinc-300 dark:border-zinc-600 pl-2">
                    "{{ claim.message }}"
                </p>

                <p v-if="claim.requiredApprovals > 1" class="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                    Approvals: {{ claim.currentApprovals }}/{{ claim.requiredApprovals }}
                </p>

                <div class="mb-3">
                    <input
                        v-model="reviewNotes"
                        class="w-full border dark:border-zinc-600 rounded p-2 text-sm dark:bg-zinc-800 dark:text-white"
                        placeholder="Review notes (optional)"
                    />
                </div>

                <div class="flex gap-2">
                    <button
                        @click="handleReview(claim.id, 'approve')"
                        :disabled="reviewingClaimId === claim.id"
                        class="flex-1 px-3 py-1.5 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                    >
                        {{ reviewingClaimId === claim.id ? '...' : 'Approve' }}
                    </button>
                    <button
                        @click="handleReview(claim.id, 'deny')"
                        :disabled="reviewingClaimId === claim.id"
                        class="flex-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                        {{ reviewingClaimId === claim.id ? '...' : 'Deny' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
