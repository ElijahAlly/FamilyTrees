<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import type { TempAccessType } from '@/types';

const props = defineProps<{
    familyId: number;
}>();

const authStore = useAuthStore();
const claimsStore = useClaimsStore();
const { user } = storeToRefs(authStore);

const records = ref<(TempAccessType & { isExpired?: boolean; visitsExhausted?: boolean })[]>([]);
const loadingRecords = ref(false);
const showForm = ref(false);
const creating = ref(false);
const successMessage = ref('');

// Form state
const email = ref('');
const accessType = ref<'family' | 'person'>('family');
const personId = ref<number | undefined>(undefined);
const expiresInDays = ref<number>(7);
const maxVisits = ref<number | undefined>(undefined);

const loadRecords = async () => {
    if (!user.value) return;
    loadingRecords.value = true;
    records.value = await claimsStore.fetchTempAccessList(props.familyId, user.value.id);
    loadingRecords.value = false;
};

const handleCreate = async () => {
    if (!user.value || !email.value) return;

    creating.value = true;
    successMessage.value = '';

    const result = await claimsStore.createTempAccess({
        familyId: props.familyId,
        userId: user.value.id,
        email: email.value,
        accessType: accessType.value,
        personId: accessType.value === 'person' ? personId.value : undefined,
        expiresInDays: expiresInDays.value || undefined,
        maxVisits: maxVisits.value || undefined,
    });

    creating.value = false;

    if (result) {
        successMessage.value = `Temporary access granted to ${email.value}`;
        email.value = '';
        personId.value = undefined;
        expiresInDays.value = 7;
        maxVisits.value = undefined;
        showForm.value = false;
        setTimeout(() => successMessage.value = '', 3000);
        await loadRecords();
    }
};

const handleRevoke = async (tempAccessId: string) => {
    if (!user.value) return;

    const result = await claimsStore.revokeTempAccess({
        tempAccessId,
        familyId: props.familyId,
        userId: user.value.id,
    });

    if (result) {
        successMessage.value = 'Temporary access revoked';
        setTimeout(() => successMessage.value = '', 3000);
        await loadRecords();
    }
};

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
};

onMounted(loadRecords);
</script>

<template>
    <div class="w-full p-4 border dark:border-zinc-700 rounded-lg">
        <h3 class="text-lg font-semibold dark:text-white mb-4 flex items-center gap-2">
            <Icon icon="mdi:clock-outline" class="w-5 h-5" />
            Temporary Access
        </h3>

        <!-- Success message -->
        <div v-if="successMessage" class="mb-3 p-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded text-sm">
            {{ successMessage }}
        </div>

        <!-- Error message -->
        <div v-if="claimsStore.error" class="mb-3 p-2 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded text-sm">
            {{ claimsStore.error }}
        </div>

        <!-- Create form -->
        <div v-if="showForm" class="mb-4 space-y-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
            <div>
                <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Email</label>
                <input
                    v-model="email"
                    type="email"
                    placeholder="researcher@example.com"
                    class="w-full border dark:border-zinc-600 rounded-md p-2 text-sm dark:bg-zinc-800 dark:text-white"
                />
            </div>

            <div>
                <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Access type</label>
                <select
                    v-model="accessType"
                    class="w-full border dark:border-zinc-600 rounded-md p-2 text-sm dark:bg-zinc-800 dark:text-white"
                >
                    <option value="family">Family page</option>
                    <option value="person">Specific person</option>
                </select>
            </div>

            <div v-if="accessType === 'person'">
                <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Person ID</label>
                <input
                    v-model.number="personId"
                    type="number"
                    min="1"
                    placeholder="Person ID"
                    class="w-full border dark:border-zinc-600 rounded-md p-2 text-sm dark:bg-zinc-800 dark:text-white"
                />
            </div>

            <div class="flex gap-3">
                <div class="flex-1">
                    <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Expires in (days)</label>
                    <input
                        v-model.number="expiresInDays"
                        type="number"
                        min="1"
                        class="w-full border dark:border-zinc-600 rounded-md p-2 text-sm dark:bg-zinc-800 dark:text-white"
                        placeholder="7"
                    />
                </div>
                <div class="flex-1">
                    <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Max visits (optional)</label>
                    <input
                        v-model.number="maxVisits"
                        type="number"
                        min="1"
                        class="w-full border dark:border-zinc-600 rounded-md p-2 text-sm dark:bg-zinc-800 dark:text-white"
                        placeholder="Unlimited"
                    />
                </div>
            </div>

            <div class="flex gap-2">
                <button
                    @click="handleCreate"
                    :disabled="creating || !email"
                    class="flex-1 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
                >
                    {{ creating ? 'Granting...' : 'Grant Access' }}
                </button>
                <button
                    @click="showForm = false"
                    class="px-4 py-2 border dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-sm"
                >
                    Cancel
                </button>
            </div>
        </div>

        <!-- Add button -->
        <button
            v-if="!showForm"
            @click="showForm = true"
            class="w-full mb-4 py-2 border dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-sm flex items-center justify-center gap-1"
        >
            <Icon icon="mdi:plus" class="w-4 h-4" />
            Grant Temporary Access
        </button>

        <!-- Loading -->
        <div v-if="loadingRecords" class="text-sm text-zinc-500 dark:text-zinc-400">
            Loading records...
        </div>

        <!-- Records list -->
        <div v-else class="space-y-2">
            <div v-if="records.length === 0" class="text-sm text-zinc-500 dark:text-zinc-400">
                No temporary access records.
            </div>

            <div
                v-for="record in records"
                :key="record.id"
                class="flex items-center justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50"
                :class="{
                    'opacity-50': record.isExpired || record.visitsExhausted,
                }"
            >
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium dark:text-white truncate">{{ record.email }}</p>
                    <div class="flex flex-wrap gap-1 mt-1">
                        <span class="text-xs px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded dark:text-zinc-300">
                            {{ record.accessType }}
                        </span>
                        <span class="text-xs text-zinc-500 dark:text-zinc-400">
                            Expires: {{ formatDate(record.expiresAt) }}
                        </span>
                        <span v-if="record.maxVisits" class="text-xs text-zinc-500 dark:text-zinc-400">
                            Visits: {{ record.visitsUsed }}/{{ record.maxVisits }}
                        </span>
                        <span v-if="record.isExpired" class="text-xs px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">
                            Expired
                        </span>
                        <span v-if="record.visitsExhausted" class="text-xs px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded">
                            Visits exhausted
                        </span>
                    </div>
                </div>

                <button
                    v-if="!record.isExpired && !record.visitsExhausted"
                    @click="handleRevoke(record.id)"
                    class="shrink-0 ml-2 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                    title="Revoke access"
                >
                    Revoke
                </button>
            </div>
        </div>
    </div>
</template>
