<script setup lang="ts">
import { ref } from 'vue';
import { Icon } from '@iconify/vue';

const emit = defineEmits<{
    created: [family: any];
}>();

const authStore = useAuthStore();
const claimsStore = useClaimsStore();
const { user, profile } = storeToRefs(authStore);

const familyName = ref('');
const visibility = ref<'public' | 'private'>('private');
const creating = ref(false);
const errorMsg = ref('');

const handleCreate = async () => {
    if (!user.value || !familyName.value.trim()) return;

    creating.value = true;
    errorMsg.value = '';

    const result = await claimsStore.createFamily({
        familyName: familyName.value.trim(),
        userId: user.value.id,
        visibility: visibility.value,
        personId: profile.value?.id,
    });

    creating.value = false;

    if (result) {
        emit('created', result);
    } else {
        errorMsg.value = claimsStore.error || 'Failed to create family';
    }
};
</script>

<template>
    <div class="w-full max-w-md mx-auto">
        <h2 class="text-xl font-semibold dark:text-white mb-4 flex items-center gap-2">
            <Icon icon="mdi:family-tree" class="w-6 h-6" />
            Create New Family
        </h2>

        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Family Name (Last Name)
                </label>
                <input
                    v-model="familyName"
                    type="text"
                    class="w-full border dark:border-zinc-600 rounded-md p-3 dark:bg-zinc-800 dark:text-white"
                    placeholder="e.g. Smith"
                    @keydown.enter="handleCreate"
                />
            </div>

            <div>
                <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Visibility
                </label>
                <div class="flex gap-3">
                    <button
                        @click="visibility = 'public'"
                        :class="[
                            'flex-1 flex items-center justify-center gap-2 p-3 border rounded-md transition-colors',
                            visibility === 'public'
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                : 'border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300'
                        ]"
                    >
                        <Icon icon="mdi:earth" class="w-5 h-5" />
                        <span class="text-sm">Public</span>
                    </button>
                    <button
                        @click="visibility = 'private'"
                        :class="[
                            'flex-1 flex items-center justify-center gap-2 p-3 border rounded-md transition-colors',
                            visibility === 'private'
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                : 'border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300'
                        ]"
                    >
                        <Icon icon="mdi:lock" class="w-5 h-5" />
                        <span class="text-sm">Private</span>
                    </button>
                </div>
                <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    {{ visibility === 'public' ? 'Visible to everyone who searches' : 'Only visible to family members or via invite link & code' }}
                </p>
            </div>

            <p v-if="errorMsg" class="text-red-500 text-sm">{{ errorMsg }}</p>

            <button
                @click="handleCreate"
                :disabled="creating || !familyName.trim()"
                class="w-full py-3 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 transition-colors font-medium"
            >
                {{ creating ? 'Creating...' : 'Create Family' }}
            </button>

            <p class="text-xs text-zinc-500 dark:text-zinc-400 text-center">
                You will be the admin of this family. You can invite others to join after creating it.
            </p>
        </div>
    </div>
</template>
