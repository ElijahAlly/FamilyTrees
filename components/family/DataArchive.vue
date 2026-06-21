<script setup lang="ts">
import { ref, computed } from 'vue';
import { Icon } from '@iconify/vue';
import { useFamilyStore } from '@/stores/useFamily';

const props = defineProps<{
    familyId: number;
}>();

const authStore = useAuthStore();
const claimsStore = useClaimsStore();
const familyStore = useFamilyStore();
const { user } = storeToRefs(authStore);
const { family } = storeToRefs(familyStore);

const processing = ref(false);
const successMessage = ref('');
const confirmAction = ref<{ type: 'family' | 'person'; action: 'archive' | 'restore'; personId?: number } | null>(null);

// Person archive form
const personIdInput = ref<number | undefined>(undefined);

const isArchived = computed(() => {
    return family.value?.archivedAt !== null && family.value?.archivedAt !== undefined;
});

const handleFamilyAction = async (action: 'archive' | 'restore') => {
    if (!user.value) return;

    processing.value = true;
    successMessage.value = '';

    const result = await claimsStore.archiveFamily(props.familyId, user.value.id, action);

    processing.value = false;
    confirmAction.value = null;

    if (result) {
        successMessage.value = action === 'archive'
            ? 'Family archived. Data is preserved but hidden.'
            : 'Family restored.';
        setTimeout(() => successMessage.value = '', 5000);
    }
};

const handlePersonAction = async (action: 'archive' | 'restore', personId: number) => {
    if (!user.value) return;

    processing.value = true;
    successMessage.value = '';

    const result = await claimsStore.archivePerson({
        personId,
        familyId: props.familyId,
        userId: user.value.id,
        action,
    });

    processing.value = false;
    confirmAction.value = null;
    personIdInput.value = undefined;

    if (result) {
        successMessage.value = action === 'archive'
            ? `Person #${personId} archived. Name still visible in tree.`
            : `Person #${personId} restored.`;
        setTimeout(() => successMessage.value = '', 5000);
    }
};
</script>

<template>
    <div class="w-full p-4 border dark:border-zinc-700 rounded-lg">
        <h3 class="text-lg font-semibold dark:text-white mb-4 flex items-center gap-2">
            <Icon icon="mdi:archive" class="w-5 h-5" />
            Archive / Delete Data
        </h3>

        <div v-if="successMessage" class="mb-3 p-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded text-sm">
            {{ successMessage }}
        </div>

        <div v-if="claimsStore.error" class="mb-3 p-2 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded text-sm">
            {{ claimsStore.error }}
        </div>

        <!-- Confirm dialog -->
        <div v-if="confirmAction" class="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
            <p class="text-sm dark:text-white mb-2">
                <template v-if="confirmAction.type === 'family' && confirmAction.action === 'archive'">
                    Archive this entire family? All memberships will be suspended but data is preserved and can be restored later.
                </template>
                <template v-else-if="confirmAction.type === 'family' && confirmAction.action === 'restore'">
                    Restore this family? All previous memberships will be reactivated.
                </template>
                <template v-else-if="confirmAction.type === 'person' && confirmAction.action === 'archive'">
                    Archive person #{{ confirmAction.personId }}? Personal details will be cleared but the name remains visible in the tree. This can be restored later.
                </template>
                <template v-else>
                    Restore person #{{ confirmAction.personId }}? Privacy settings will be reset to defaults.
                </template>
            </p>
            <div class="flex gap-2">
                <button
                    @click="confirmAction.type === 'family'
                        ? handleFamilyAction(confirmAction.action)
                        : handlePersonAction(confirmAction.action, confirmAction.personId!)"
                    :disabled="processing"
                    :class="[
                        'px-3 py-1 text-sm text-white rounded disabled:opacity-50',
                        confirmAction.action === 'archive' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                    ]"
                >
                    {{ processing ? 'Processing...' : 'Confirm' }}
                </button>
                <button
                    @click="confirmAction = null"
                    class="px-3 py-1 text-sm border dark:border-zinc-600 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:text-white"
                >
                    Cancel
                </button>
            </div>
        </div>

        <div class="space-y-4">
            <!-- Family archive -->
            <div>
                <h4 class="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Family</h4>
                <button
                    v-if="!isArchived"
                    @click="confirmAction = { type: 'family', action: 'archive' }"
                    :disabled="processing"
                    class="w-full py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors text-sm"
                >
                    Archive Family
                </button>
                <button
                    v-else
                    @click="confirmAction = { type: 'family', action: 'restore' }"
                    :disabled="processing"
                    class="w-full py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors text-sm"
                >
                    Restore Family
                </button>
                <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    {{ isArchived ? 'Family is currently archived.' : 'Archiving hides the family but preserves all data.' }}
                </p>
            </div>

            <!-- Person archive -->
            <div>
                <h4 class="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Person</h4>
                <div class="flex gap-2">
                    <input
                        v-model.number="personIdInput"
                        type="number"
                        min="1"
                        placeholder="Person ID"
                        class="flex-1 border dark:border-zinc-600 rounded-md p-2 text-sm dark:bg-zinc-800 dark:text-white"
                    />
                    <button
                        @click="confirmAction = { type: 'person', action: 'archive', personId: personIdInput }"
                        :disabled="!personIdInput || processing"
                        class="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 text-sm"
                    >
                        Archive
                    </button>
                    <button
                        @click="confirmAction = { type: 'person', action: 'restore', personId: personIdInput }"
                        :disabled="!personIdInput || processing"
                        class="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
                    >
                        Restore
                    </button>
                </div>
                <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Only admins or the person who claimed the profile can archive/restore.
                </p>
            </div>
        </div>
    </div>
</template>
