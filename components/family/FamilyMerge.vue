<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Icon } from '@iconify/vue';

const props = defineProps<{
    familyId: number;
}>();

const authStore = useAuthStore();
const claimsStore = useClaimsStore();
const { user } = storeToRefs(authStore);

const mergeRequests = ref<any[]>([]);
const loadingRequests = ref(false);
const showForm = ref(false);
const submitting = ref(false);
const successMessage = ref('');

// Form state
const targetFamilyId = ref<number | undefined>(undefined);
const mergeNotes = ref('');

// Conflict resolution state
const resolvingRequest = ref<any | null>(null);
const resolutions = ref<Record<string, Record<string, any>>>({});

const loadRequests = async () => {
    if (!user.value) return;
    loadingRequests.value = true;
    mergeRequests.value = await claimsStore.fetchMergeRequests(props.familyId, user.value.id);
    loadingRequests.value = false;
};

const handleSubmit = async () => {
    if (!user.value || !targetFamilyId.value) return;

    submitting.value = true;
    successMessage.value = '';

    const result = await claimsStore.requestMerge({
        sourceFamilyId: props.familyId,
        targetFamilyId: targetFamilyId.value,
        userId: user.value.id,
        mergeNotes: mergeNotes.value || undefined,
    });

    submitting.value = false;

    if (result) {
        successMessage.value = `Merge request sent. ${result.conflictCount} conflict(s) detected.`;
        targetFamilyId.value = undefined;
        mergeNotes.value = '';
        showForm.value = false;
        setTimeout(() => successMessage.value = '', 5000);
        await loadRequests();
    }
};

const startResolving = (request: any) => {
    resolvingRequest.value = request;
    resolutions.value = {};

    // Pre-populate resolutions with target values as default
    const conflicts = (request.conflicts || []) as any[];
    for (const conflict of conflicts) {
        const key = `${conflict.sourcePersonId}-${conflict.targetPersonId}`;
        resolutions.value[key] = {};
        for (const field of conflict.fields) {
            resolutions.value[key][field.field] = field.targetValue; // Default to target
        }
    }
};

const handleResolve = async (action: 'approve' | 'reject') => {
    if (!user.value || !resolvingRequest.value) return;

    submitting.value = true;

    const result = await claimsStore.resolveMerge({
        mergeRequestId: resolvingRequest.value.id,
        userId: user.value.id,
        action,
        resolutions: action === 'approve' ? resolutions.value : undefined,
    });

    submitting.value = false;

    if (result) {
        successMessage.value = action === 'approve'
            ? `Merge completed! ${result.peopleMoved} people moved.`
            : 'Merge request rejected.';
        resolvingRequest.value = null;
        setTimeout(() => successMessage.value = '', 5000);
        await loadRequests();
    }
};

onMounted(loadRequests);
</script>

<template>
    <div class="w-full p-4 border dark:border-zinc-700 rounded-lg">
        <h3 class="text-lg font-semibold dark:text-white mb-4 flex items-center gap-2">
            <Icon icon="mdi:merge" class="w-5 h-5" />
            Merge Families
        </h3>

        <div v-if="successMessage" class="mb-3 p-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded text-sm">
            {{ successMessage }}
        </div>

        <div v-if="claimsStore.error" class="mb-3 p-2 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded text-sm">
            {{ claimsStore.error }}
        </div>

        <!-- Conflict Resolution Dialog -->
        <div v-if="resolvingRequest" class="mb-4 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg space-y-3">
            <h4 class="text-sm font-semibold dark:text-white">
                Resolve Conflicts: {{ resolvingRequest.sourceFamilyName }} into {{ resolvingRequest.targetFamilyName }}
            </h4>

            <div v-if="(resolvingRequest.conflicts || []).length === 0" class="text-sm text-zinc-500 dark:text-zinc-400">
                No conflicts detected. Approve to proceed with the merge.
            </div>

            <div v-for="conflict in (resolvingRequest.conflicts || [])" :key="`${conflict.sourcePersonId}-${conflict.targetPersonId}`" class="p-2 border dark:border-zinc-700 rounded">
                <p class="text-sm font-medium dark:text-white mb-2">{{ conflict.personName }}</p>
                <div v-for="field in conflict.fields" :key="field.field" class="flex items-center gap-2 mb-1">
                    <span class="text-xs text-zinc-500 w-20">{{ field.field }}:</span>
                    <label class="flex items-center gap-1 text-xs">
                        <input
                            type="radio"
                            :name="`${conflict.sourcePersonId}-${conflict.targetPersonId}-${field.field}`"
                            :value="field.sourceValue"
                            v-model="resolutions[`${conflict.sourcePersonId}-${conflict.targetPersonId}`][field.field]"
                        />
                        <span class="text-blue-600 dark:text-blue-400">{{ field.sourceValue }}</span>
                        <span class="text-zinc-400">(source)</span>
                    </label>
                    <label class="flex items-center gap-1 text-xs">
                        <input
                            type="radio"
                            :name="`${conflict.sourcePersonId}-${conflict.targetPersonId}-${field.field}`"
                            :value="field.targetValue"
                            v-model="resolutions[`${conflict.sourcePersonId}-${conflict.targetPersonId}`][field.field]"
                        />
                        <span class="text-green-600 dark:text-green-400">{{ field.targetValue }}</span>
                        <span class="text-zinc-400">(target)</span>
                    </label>
                </div>
            </div>

            <div class="flex gap-2">
                <button
                    @click="handleResolve('approve')"
                    :disabled="submitting"
                    class="flex-1 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors text-sm"
                >
                    {{ submitting ? 'Processing...' : 'Approve & Merge' }}
                </button>
                <button
                    @click="handleResolve('reject')"
                    :disabled="submitting"
                    class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors text-sm"
                >
                    Reject
                </button>
                <button
                    @click="resolvingRequest = null"
                    class="px-4 py-2 border dark:border-zinc-600 dark:text-zinc-300 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-sm"
                >
                    Cancel
                </button>
            </div>
        </div>

        <!-- Request Merge Form -->
        <div v-if="showForm && !resolvingRequest" class="mb-4 space-y-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
            <p class="text-sm text-zinc-600 dark:text-zinc-400">
                Merge this family into another family. Duplicate people will be matched by name.
            </p>

            <div>
                <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Target Family ID</label>
                <input
                    v-model.number="targetFamilyId"
                    type="number"
                    min="1"
                    placeholder="ID of the family to merge into"
                    class="w-full border dark:border-zinc-600 rounded-md p-2 text-sm dark:bg-zinc-800 dark:text-white"
                />
            </div>

            <div>
                <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Notes (optional)</label>
                <textarea
                    v-model="mergeNotes"
                    rows="2"
                    placeholder="Reason for merge..."
                    class="w-full border dark:border-zinc-600 rounded-md p-2 text-sm dark:bg-zinc-800 dark:text-white resize-none"
                />
            </div>

            <div class="flex gap-2">
                <button
                    @click="handleSubmit"
                    :disabled="submitting || !targetFamilyId"
                    class="flex-1 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
                >
                    {{ submitting ? 'Submitting...' : 'Request Merge' }}
                </button>
                <button
                    @click="showForm = false"
                    class="px-4 py-2 border dark:border-zinc-600 dark:text-zinc-300 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-sm"
                >
                    Cancel
                </button>
            </div>
        </div>

        <button
            v-if="!showForm && !resolvingRequest"
            @click="showForm = true"
            class="w-full mb-4 py-2 border dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-sm flex items-center justify-center gap-1"
        >
            <Icon icon="mdi:plus" class="w-4 h-4" />
            Request Family Merge
        </button>

        <!-- Loading -->
        <div v-if="loadingRequests" class="text-sm text-zinc-500 dark:text-zinc-400">
            Loading merge requests...
        </div>

        <!-- Merge requests list -->
        <div v-else class="space-y-2">
            <div v-if="mergeRequests.length === 0 && !showForm" class="text-sm text-zinc-500 dark:text-zinc-400">
                No merge requests.
            </div>

            <div
                v-for="request in mergeRequests"
                :key="request.id"
                class="flex items-center justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50"
            >
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium dark:text-white truncate">
                        {{ request.sourceFamilyName }} &rarr; {{ request.targetFamilyName }}
                    </p>
                    <div class="flex gap-1 mt-1">
                        <span
                            :class="[
                                'text-xs px-1.5 py-0.5 rounded',
                                request.status === 'pending' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' :
                                request.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                                'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                            ]"
                        >
                            {{ request.status }}
                        </span>
                        <span v-if="request.conflictCount > 0" class="text-xs text-zinc-500 dark:text-zinc-400">
                            {{ request.conflictCount }} conflict(s)
                        </span>
                    </div>
                </div>

                <button
                    v-if="request.status === 'pending' && request.targetFamilyId === familyId"
                    @click="startResolving(request)"
                    class="shrink-0 ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Review
                </button>
            </div>
        </div>
    </div>
</template>
