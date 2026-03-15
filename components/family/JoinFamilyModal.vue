<script setup lang="ts">
import { ref } from 'vue';
import { Icon } from '@iconify/vue';
import type { FamilyType } from '@/types';

const props = defineProps<{
    family: FamilyType;
    show: boolean;
    mode: 'join' | 'add_self';
}>();

const emit = defineEmits<{
    close: [];
    joined: [];
}>();

const authStore = useAuthStore();
const claimsStore = useClaimsStore();
const { user } = storeToRefs(authStore);

const message = ref('');
const submitting = ref(false);
const submitted = ref(false);
const errorMsg = ref('');

const handleJoin = async () => {
    if (!user.value) return;

    submitting.value = true;
    errorMsg.value = '';

    const result = await claimsStore.submitClaim({
        type: props.mode === 'add_self' ? 'add_self_to_family' : 'join_family',
        requesterId: user.value.id,
        familyId: props.family.id,
        message: message.value || undefined,
    });

    submitting.value = false;

    if (result) {
        submitted.value = true;
    } else {
        errorMsg.value = claimsStore.error || 'Failed to submit request';
    }
};
</script>

<template>
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="emit('close')">
        <div class="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-lg font-semibold dark:text-white">
                    {{ mode === 'add_self' ? 'Add Yourself to Family' : 'Join Family' }}
                </h2>
                <button @click="emit('close')" class="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">
                    <Icon icon="mdi:close" class="w-5 h-5" />
                </button>
            </div>

            <!-- Success -->
            <div v-if="submitted" class="text-center py-4">
                <Icon icon="mdi:check-circle" class="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <p class="dark:text-white font-medium">Request submitted!</p>
                <p class="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
                    A family admin will review your request to join the <strong>{{ family.familyName }}</strong> family.
                </p>
                <button
                    @click="emit('close')"
                    class="mt-4 px-4 py-2 bg-zinc-200 dark:bg-zinc-700 rounded-md hover:bg-zinc-300 dark:hover:bg-zinc-600 dark:text-white transition-colors"
                >
                    Close
                </button>
            </div>

            <!-- Form -->
            <div v-else>
                <p class="text-zinc-600 dark:text-zinc-300 mb-4">
                    <template v-if="mode === 'add_self'">
                        You are requesting to add yourself to the <strong>{{ family.familyName }}</strong> family.
                        Your info will be added and sent to the admin(s) for approval.
                    </template>
                    <template v-else>
                        You are requesting to join the <strong>{{ family.familyName }}</strong> family.
                        This request will be sent to the family admin(s) for approval.
                    </template>
                </p>

                <div class="mb-4">
                    <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        Message to admin (optional)
                    </label>
                    <textarea
                        v-model="message"
                        class="w-full border dark:border-zinc-600 rounded-md p-2 text-sm dark:bg-zinc-800 dark:text-white"
                        rows="3"
                        placeholder="Explain your relationship to this family..."
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
                        @click="handleJoin"
                        :disabled="submitting"
                        class="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                    >
                        {{ submitting ? 'Submitting...' : 'Submit Request' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
