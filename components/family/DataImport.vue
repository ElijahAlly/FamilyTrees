<script setup lang="ts">
import { ref } from 'vue';
import { Icon } from '@iconify/vue';

const props = defineProps<{
    familyId: number;
}>();

const authStore = useAuthStore();
const claimsStore = useClaimsStore();
const { user } = storeToRefs(authStore);

type ImportStep = 'upload' | 'review' | 'complete';

const step = ref<ImportStep>('upload');
const source = ref('csv');
const importing = ref(false);
const confirming = ref(false);
const importId = ref<number | null>(null);
const parsedPeople = ref<any[]>([]);
const importResult = ref<any>(null);
const fileInput = ref<HTMLInputElement | null>(null);

const sourceOptions = [
    { value: 'csv', label: 'CSV File' },
    { value: 'ancestry', label: 'Ancestry' },
    { value: 'familysearch', label: 'FamilySearch' },
    { value: 'gedcom', label: 'GEDCOM' },
    { value: 'other', label: 'Other' },
];

const handleFileUpload = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length || !user.value) return;

    const file = input.files[0];
    importing.value = true;

    const text = await file.text();

    let params: any = {
        familyId: props.familyId,
        userId: user.value.id,
        source: source.value,
    };

    if (file.name.endsWith('.csv')) {
        params.csvData = text;
    } else {
        // Try parsing as JSON
        try {
            params.jsonData = JSON.parse(text);
        } catch {
            params.csvData = text;
        }
    }

    const result = await claimsStore.parseImportData(params);
    importing.value = false;

    if (result) {
        importId.value = result.importId;
        parsedPeople.value = result.people;
        step.value = 'review';
    }

    // Reset file input
    if (fileInput.value) fileInput.value.value = '';
};

const removePerson = (index: number) => {
    parsedPeople.value.splice(index, 1);
};

const handleConfirm = async () => {
    if (!user.value || !importId.value) return;

    confirming.value = true;

    const result = await claimsStore.confirmImport({
        importId: importId.value,
        familyId: props.familyId,
        userId: user.value.id,
        reviewedPeople: parsedPeople.value,
    });

    confirming.value = false;

    if (result) {
        importResult.value = result;
        step.value = 'complete';
    }
};

const resetImport = () => {
    step.value = 'upload';
    importId.value = null;
    parsedPeople.value = [];
    importResult.value = null;
};
</script>

<template>
    <div class="w-full p-4 border dark:border-zinc-700 rounded-lg">
        <h3 class="text-lg font-semibold dark:text-white mb-4 flex items-center gap-2">
            <Icon icon="mdi:upload" class="w-5 h-5" />
            Import Data
        </h3>

        <div v-if="claimsStore.error" class="mb-3 p-2 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded text-sm">
            {{ claimsStore.error }}
        </div>

        <!-- Step 1: Upload -->
        <div v-if="step === 'upload'" class="space-y-3">
            <p class="text-sm text-zinc-600 dark:text-zinc-400">
                Import family data from Ancestry, FamilySearch, or a CSV file.
            </p>

            <div>
                <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Source</label>
                <select
                    v-model="source"
                    class="w-full border dark:border-zinc-600 rounded-md p-2 text-sm dark:bg-zinc-800 dark:text-white"
                >
                    <option v-for="opt in sourceOptions" :key="opt.value" :value="opt.value">
                        {{ opt.label }}
                    </option>
                </select>
            </div>

            <div>
                <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">File (CSV or JSON)</label>
                <input
                    ref="fileInput"
                    type="file"
                    accept=".csv,.json,.ged"
                    @change="handleFileUpload"
                    :disabled="importing"
                    class="w-full text-sm text-zinc-600 dark:text-zinc-400 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer"
                />
            </div>

            <div v-if="importing" class="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                <Icon icon="mdi:loading" class="w-4 h-4 animate-spin" />
                Parsing file...
            </div>

            <div class="text-xs text-zinc-500 dark:text-zinc-400 mt-2 space-y-1">
                <p>CSV files should have columns like: firstName, lastName, birthDate, deathDate, gender</p>
                <p>JSON files should have a "people" array or be an array of person objects.</p>
            </div>
        </div>

        <!-- Step 2: Review -->
        <div v-if="step === 'review'" class="space-y-3">
            <p class="text-sm text-zinc-600 dark:text-zinc-400">
                Review the {{ parsedPeople.length }} people found. Edit or remove entries before confirming.
            </p>

            <div class="max-h-80 overflow-y-auto space-y-2">
                <div
                    v-for="(person, idx) in parsedPeople"
                    :key="idx"
                    class="p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg"
                >
                    <div class="flex items-start justify-between">
                        <div class="flex-1 grid grid-cols-2 gap-2">
                            <div>
                                <label class="text-xs text-zinc-500">First Name</label>
                                <input
                                    v-model="person.firstName"
                                    class="w-full text-sm border dark:border-zinc-600 rounded p-1 dark:bg-zinc-800 dark:text-white"
                                />
                            </div>
                            <div>
                                <label class="text-xs text-zinc-500">Last Name</label>
                                <input
                                    v-model="person.lastName"
                                    class="w-full text-sm border dark:border-zinc-600 rounded p-1 dark:bg-zinc-800 dark:text-white"
                                />
                            </div>
                            <div>
                                <label class="text-xs text-zinc-500">Birth Date</label>
                                <input
                                    v-model="person.birthDate"
                                    type="date"
                                    class="w-full text-sm border dark:border-zinc-600 rounded p-1 dark:bg-zinc-800 dark:text-white"
                                />
                            </div>
                            <div>
                                <label class="text-xs text-zinc-500">Gender</label>
                                <select
                                    v-model="person.gender"
                                    class="w-full text-sm border dark:border-zinc-600 rounded p-1 dark:bg-zinc-800 dark:text-white"
                                >
                                    <option value="M">Male</option>
                                    <option value="F">Female</option>
                                    <option value="N">Non-binary</option>
                                    <option value="U">Unknown</option>
                                </select>
                            </div>
                        </div>
                        <button
                            @click="removePerson(idx)"
                            class="shrink-0 ml-2 p-1 text-red-500 hover:text-red-700"
                            title="Remove"
                        >
                            <Icon icon="mdi:close" class="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            <div class="flex gap-2">
                <button
                    @click="handleConfirm"
                    :disabled="confirming || parsedPeople.length === 0"
                    class="flex-1 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
                >
                    {{ confirming ? 'Importing...' : `Confirm Import (${parsedPeople.length} people)` }}
                </button>
                <button
                    @click="resetImport"
                    class="px-4 py-2 border dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-sm"
                >
                    Cancel
                </button>
            </div>
        </div>

        <!-- Step 3: Complete -->
        <div v-if="step === 'complete'" class="space-y-3">
            <div class="p-3 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded text-sm">
                Import complete! {{ importResult?.peopleAdded }} people added.
                <span v-if="importResult?.peopleSkipped"> {{ importResult.peopleSkipped }} skipped.</span>
            </div>

            <button
                @click="resetImport"
                class="w-full py-2 border dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-sm"
            >
                Import More
            </button>
        </div>
    </div>
</template>
