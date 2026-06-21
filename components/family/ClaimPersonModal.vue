<script setup lang="ts">
import { ref, computed } from 'vue';
import { Icon } from '@iconify/vue';
import type { PersonType } from '@/types';
import { getFullName } from '@/utils/person';

const props = defineProps<{
    person: PersonType;
    familyId: number;
    show: boolean;
}>();

const emit = defineEmits<{
    close: [];
    claimed: [];
}>();

const authStore = useAuthStore();
const claimsStore = useClaimsStore();
const { user } = storeToRefs(authStore);

const message = ref('');
const submitting = ref(false);
const submitted = ref(false);
const errorMsg = ref('');

const isAlreadyClaimed = computed(() => !!props.person.claimedBy);

const handleClaim = async () => {
    if (!user.value) return;

    submitting.value = true;
    errorMsg.value = '';

    const result = await claimsStore.submitClaim({
        type: 'claim_person',
        requesterId: user.value.id,
        personId: props.person.id,
        familyId: props.familyId,
        message: message.value || undefined,
        authProvider: 'email',
    });

    submitting.value = false;

    if (result) {
        submitted.value = true;
    } else {
        errorMsg.value = claimsStore.error || 'Failed to submit claim';
    }
};
</script>

<template>
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="emit('close')">
        <div class="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <!-- Header -->
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-lg font-semibold dark:text-white">Claim Person</h2>
                <button @click="emit('close')" class="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">
                    <Icon icon="mdi:close" class="w-5 h-5" />
                </button>
            </div>

            <!-- Already claimed -->
            <div v-if="isAlreadyClaimed" class="text-amber-600 dark:text-amber-400 mb-4">
                <p>This person has already been claimed by another user.</p>
            </div>

            <!-- Success state -->
            <div v-else-if="submitted" class="text-center py-4">
                <Icon icon="mdi:check-circle" class="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <p class="dark:text-white font-medium">Claim request submitted!</p>
                <p class="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
                    A family admin will review your request.
                </p>
                <button
                    @click="emit('close')"
                    class="mt-4 px-4 py-2 bg-zinc-200 dark:bg-zinc-700 rounded-md hover:bg-zinc-300 dark:hover:bg-zinc-600 dark:text-white transition-colors"
                >
                    Close
                </button>
            </div>

            <!-- Claim form -->
            <div v-else>
                <p class="text-zinc-600 dark:text-zinc-300 mb-4">
                    You are requesting to claim <strong>{{ getFullName(person) }}</strong> as yourself.
                    This request will be sent to the family admin(s) for approval.
                </p>

                <div v-if="user" class="mb-4 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-md">
                    <p class="text-sm text-zinc-500 dark:text-zinc-400">Signed in as:</p>
                    <p class="dark:text-white">{{ user.email }}</p>
                    <p class="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Provider: Email/OTP</p>
                </div>

                <div class="mb-4">
                    <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        Message to admin (optional)
                    </label>
                    <textarea
                        v-model="message"
                        class="w-full border dark:border-zinc-600 rounded-md p-2 text-sm dark:bg-zinc-800 dark:text-white"
                        rows="3"
                        placeholder="Explain how you're related to help the admin verify your identity..."
                    />
                </div>

                <p v-if="errorMsg" class="text-red-500 text-sm mb-3">{{ errorMsg }}</p>

                <div class="flex justify-end gap-2">
                    <button
                        @click="emit('close')"
                        class="px-4 py-2 border dark:border-zinc-600 rounded-md text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        @click="handleClaim"
                        :disabled="submitting"
                        class="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                    >
                        {{ submitting ? 'Submitting...' : 'Submit Claim' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
