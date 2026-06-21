<script setup lang="ts">
import { ref } from 'vue';
import { Icon } from '@iconify/vue';
import DiscoverSplit from '@/components/DiscoverSplit.vue';
import type { InviteLink } from '@/types';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const claimsStore = useClaimsStore();
const { user, profile } = storeToRefs(authStore);

// Invite link handling
const inviteCode = ref(route.query.invite as string || '');
const inviteAccepting = ref(false);
const inviteAccepted = ref(false);

// Verify invite code using useAsyncData for SSR support and deduplication
const { data: inviteVerifyResult, error: inviteFetchError, status: inviteStatus } = useAsyncData(
    `invite-verify-${inviteCode.value}`,
    () => $fetch<{ valid: boolean; data?: InviteLink & { familyName?: string; personName?: string }; error?: string }>('/api/invites/verify', {
        method: 'GET',
        params: { code: inviteCode.value },
    }),
    { immediate: !!inviteCode.value }
);

const inviteLoading = computed(() => inviteStatus.value === 'pending');
const inviteData = computed(() => inviteVerifyResult.value?.valid ? inviteVerifyResult.value.data ?? null : null);
const inviteError = ref(inviteFetchError.value?.message || '');

const handleAcceptInvite = async () => {
    if (!user.value) {
        // Not logged in — redirect to signup, then come back
        navigateTo(`/signup?existing=true&redirect=/discover?invite=${inviteCode.value}`);
        return;
    }

    inviteAccepting.value = true;
    const result = await claimsStore.acceptInvite(inviteCode.value, user.value.id);
    inviteAccepting.value = false;

    if (result) {
        inviteAccepted.value = true;
    } else {
        inviteError.value = claimsStore.error || 'Failed to accept invite';
    }
};

const dismissInvite = () => {
    inviteCode.value = '';
    inviteData.value = null;
    inviteError.value = '';
    // Clean URL
    router.replace({ query: {} });
};
</script>

<template>
    <div class="w-full h-full pt-24">
        <!-- Invite Banner -->
        <div v-if="inviteCode && (inviteData || inviteError || inviteLoading)" class="max-w-2xl mx-auto mb-6 px-4">
            <!-- Loading -->
            <div v-if="inviteLoading" class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center">
                <p class="text-blue-600 dark:text-blue-400">Verifying invite link...</p>
            </div>

            <!-- Error -->
            <div v-else-if="inviteError" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div class="flex justify-between items-start">
                    <div class="flex items-center gap-2">
                        <Icon icon="mdi:alert-circle" class="w-5 h-5 text-red-500" />
                        <p class="text-red-600 dark:text-red-400">{{ inviteError }}</p>
                    </div>
                    <button @click="dismissInvite" class="text-red-400 hover:text-red-600">
                        <Icon icon="mdi:close" class="w-4 h-4" />
                    </button>
                </div>
            </div>

            <!-- Accepted -->
            <div v-else-if="inviteAccepted" class="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
                <div class="flex items-center gap-2">
                    <Icon icon="mdi:check-circle" class="w-5 h-5 text-emerald-500" />
                    <p class="text-emerald-600 dark:text-emerald-400">
                        Your request has been submitted! A family admin will review it.
                    </p>
                </div>
                <button @click="dismissInvite" class="mt-2 text-sm text-emerald-600 dark:text-emerald-400 underline">
                    Dismiss
                </button>
            </div>

            <!-- Valid invite -->
            <div v-else-if="inviteData" class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <h3 class="font-semibold text-blue-800 dark:text-blue-200">You've been invited!</h3>
                        <p class="text-sm text-blue-600 dark:text-blue-400 mt-1">
                            <template v-if="inviteData.type === 'person' && inviteData.personName">
                                Claim <strong>{{ inviteData.personName }}</strong> in the <strong>{{ inviteData.familyName }}</strong> family
                            </template>
                            <template v-else>
                                Join the <strong>{{ inviteData.familyName }}</strong> family
                            </template>
                        </p>
                    </div>
                    <button @click="dismissInvite" class="text-blue-400 hover:text-blue-600">
                        <Icon icon="mdi:close" class="w-4 h-4" />
                    </button>
                </div>
                <div class="flex gap-2">
                    <button
                        @click="handleAcceptInvite"
                        :disabled="inviteAccepting"
                        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
                    >
                        {{ !user ? 'Login to Accept' : inviteAccepting ? 'Accepting...' : 'Accept Invite' }}
                    </button>
                    <button
                        @click="dismissInvite"
                        class="px-4 py-2 border border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-sm"
                    >
                        Dismiss
                    </button>
                </div>
            </div>
        </div>

        <DiscoverSplit />
    </div>
</template>
