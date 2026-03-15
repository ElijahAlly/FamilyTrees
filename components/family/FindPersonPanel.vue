<script lang="ts" setup>
import { ref, watch, computed } from 'vue';
import { Icon } from '@iconify/vue';
import { storeToRefs } from 'pinia';
import type { PersonType } from '@/types';
import { formatDate } from '@/utils/date';
import { useWatchFamilyStore } from '@/composables/useWatchFamilyStore';

const { isMobile } = useDevice();

const familyStore = useFamilyStore();
const { family: currentFamily, currentFamilyTree } = storeToRefs(familyStore);

const personStore = usePersonStore();
const { setSelectedPersonInTree } = personStore;

const { refreshFamilyTree } = useWatchFamilyStore();

const emit = defineEmits<{
    (e: 'close'): void;
    (e: 'personLinked'): void;
}>();

// Search state
const searchQuery = ref('');
const searchResults = ref<PersonType[]>([]);
const searching = ref(false);
const searchError = ref('');

// Link state
const selectedPerson = ref<PersonType | null>(null);
const relationship = ref<'none' | 'parent' | 'child' | 'spouse'>('none');
const relativePersonId = ref<number | null>(null);
const linking = ref(false);
const linkError = ref('');
const linkSuccess = ref(false);

// People in current tree for relationship picker
const flattenTree = (node: any): PersonType[] => {
    if (!node) return [];
    const result: PersonType[] = [node.member];
    if (node.spouse) result.push(node.spouse);
    for (const m of node.marriages || []) result.push(m);
    for (const c of node.children || []) result.push(...flattenTree(c));
    return result;
};

const treePeople = computed(() => {
    if (!currentFamilyTree.value) return [];
    const map = new Map<number, PersonType>();
    for (const p of flattenTree(currentFamilyTree.value)) {
        if (!map.has(p.id)) map.set(p.id, p);
    }
    return [...map.values()];
});

// Current family member IDs for filtering search results
const familyMemberIds = computed(() => {
    return new Set(treePeople.value.map(p => p.id));
});

let searchTimeout: ReturnType<typeof setTimeout> | null = null;

watch(searchQuery, (val) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    if (!val.trim()) {
        searchResults.value = [];
        searchError.value = '';
        return;
    }
    searchTimeout = setTimeout(() => performSearch(val.trim()), 300);
});

const performSearch = async (query: string) => {
    searching.value = true;
    searchError.value = '';
    try {
        const result = await $fetch('/api/get-all-matching-by-name', {
            method: 'GET',
            params: { name: query, searchBy: 'people' }
        }) as any;
        searchResults.value = (result.data || []) as PersonType[];
    } catch {
        searchError.value = 'Search failed. Please try again.';
        searchResults.value = [];
    } finally {
        searching.value = false;
    }
};

const selectPerson = (person: PersonType) => {
    selectedPerson.value = person;
    relationship.value = 'none';
    relativePersonId.value = null;
    linkError.value = '';
    linkSuccess.value = false;
};

const clearSelection = () => {
    selectedPerson.value = null;
    relationship.value = 'none';
    relativePersonId.value = null;
    linkError.value = '';
    linkSuccess.value = false;
};

const linkPerson = async () => {
    if (!selectedPerson.value || !currentFamily.value) return;

    if (relationship.value !== 'none' && !relativePersonId.value) {
        linkError.value = 'Please select who this person is related to.';
        return;
    }

    linking.value = true;
    linkError.value = '';
    try {
        const result = await $fetch('/api/person/link-to-family', {
            method: 'POST',
            body: {
                personId: selectedPerson.value.id,
                familyId: currentFamily.value.id,
                relationship: relationship.value,
                relativePersonId: relativePersonId.value,
            }
        }) as any;

        if (!result.success) {
            linkError.value = result.error || 'Failed to link person.';
            return;
        }

        linkSuccess.value = true;
        await refreshFamilyTree();
        emit('personLinked');

        // Auto-close after brief success state
        setTimeout(() => {
            emit('close');
        }, 1500);
    } catch (err: any) {
        linkError.value = err?.data?.message || err?.data?.error || 'Failed to link person.';
    } finally {
        linking.value = false;
    }
};

const isInFamily = (person: PersonType) => familyMemberIds.value.has(person.id);

const getInitials = (p: PersonType) =>
    `${(p.firstName || '')[0] || ''}${(p.lastName || '')[0] || ''}`.toUpperCase();
</script>

<template>
    <div
        class="absolute inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm"
        @click.self="emit('close')"
    >
        <div
            :class="[
                'bg-white dark:bg-zinc-900 shadow-2xl border border-zinc-200 dark:border-zinc-700 flex flex-col overflow-hidden',
                isMobile ? 'w-full h-full' : 'w-[480px] max-h-[80vh] mt-16 rounded-xl'
            ]"
        >
            <!-- Header -->
            <div class="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                <div class="flex items-center gap-2">
                    <Icon icon="lucide:search" class="w-4 h-4 text-zinc-500" />
                    <span class="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Find & Add Person</span>
                </div>
                <button
                    @click="emit('close')"
                    class="p-1 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 text-zinc-500 hover:text-red-500 transition-colors"
                >
                    <Icon icon="ri:close-line" class="w-5 h-5" />
                </button>
            </div>

            <!-- Content -->
            <div class="flex-1 overflow-y-auto p-4">
                <!-- Success state -->
                <div v-if="linkSuccess" class="flex flex-col items-center justify-center py-8 gap-3">
                    <div class="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                        <Icon icon="lucide:check" class="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p class="text-sm font-medium text-emerald-600 dark:text-emerald-400">Person added to tree!</p>
                </div>

                <template v-else>
                    <!-- Search input -->
                    <div class="relative mb-4">
                        <Icon icon="lucide:search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                            v-model="searchQuery"
                            type="text"
                            placeholder="Search by name..."
                            class="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-zinc-400"
                            autofocus
                        />
                        <div v-if="searching" class="absolute right-3 top-1/2 -translate-y-1/2">
                            <Icon icon="svg-spinners:ring-resize" class="w-4 h-4 text-zinc-400" />
                        </div>
                    </div>

                    <!-- Selected person - link form -->
                    <div v-if="selectedPerson" class="space-y-4">
                        <div class="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                            <div class="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-semibold text-sm shrink-0">
                                {{ getInitials(selectedPerson) }}
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                                    {{ selectedPerson.firstName }} {{ selectedPerson.middleName || '' }} {{ selectedPerson.lastName }}
                                </p>
                                <p v-if="selectedPerson.birthDate" class="text-xs text-zinc-500 dark:text-zinc-400">
                                    Born {{ formatDate(selectedPerson.birthDate) }}
                                </p>
                            </div>
                            <button @click="clearSelection" class="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 transition-colors">
                                <Icon icon="lucide:x" class="w-4 h-4" />
                            </button>
                        </div>

                        <div v-if="isInFamily(selectedPerson)" class="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                            <p class="text-sm text-amber-700 dark:text-amber-300">This person is already in the family tree.</p>
                        </div>

                        <template v-else>
                            <!-- Relationship picker -->
                            <div>
                                <label class="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Relationship (optional)</label>
                                <select
                                    v-model="relationship"
                                    class="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="none">No relationship (just add to family)</option>
                                    <option value="parent">Parent of...</option>
                                    <option value="child">Child of...</option>
                                    <option value="spouse">Spouse of...</option>
                                </select>
                            </div>

                            <!-- Relative picker -->
                            <div v-if="relationship !== 'none'">
                                <label class="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                                    {{ relationship === 'parent' ? 'Parent of' : relationship === 'child' ? 'Child of' : 'Spouse of' }}
                                </label>
                                <select
                                    v-model="relativePersonId"
                                    class="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option :value="null" disabled>Select a person...</option>
                                    <option v-for="p in treePeople" :key="p.id" :value="p.id">
                                        {{ p.firstName }} {{ p.lastName }}
                                    </option>
                                </select>
                            </div>

                            <!-- Error -->
                            <p v-if="linkError" class="text-xs text-red-500">{{ linkError }}</p>

                            <!-- Link button -->
                            <button
                                @click="linkPerson"
                                :disabled="linking"
                                class="w-full px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <Icon v-if="!linking" icon="lucide:user-plus" class="w-4 h-4" />
                                <Icon v-else icon="svg-spinners:ring-resize" class="w-4 h-4" />
                                {{ linking ? 'Adding...' : 'Add to Family Tree' }}
                            </button>
                        </template>
                    </div>

                    <!-- Search results -->
                    <div v-else>
                        <p v-if="searchError" class="text-xs text-red-500 mb-2">{{ searchError }}</p>

                        <div v-if="searchQuery.trim() && !searching && searchResults.length === 0" class="text-center py-6">
                            <Icon icon="lucide:user-x" class="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
                            <p class="text-sm text-zinc-500 dark:text-zinc-400">No people found matching "{{ searchQuery }}"</p>
                            <p class="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                                The person may have been permanently deleted. Try adding them as a new person instead.
                            </p>
                        </div>

                        <div v-if="searchResults.length" class="space-y-1">
                            <p class="text-xs text-zinc-400 dark:text-zinc-500 mb-2">{{ searchResults.length }} result{{ searchResults.length !== 1 ? 's' : '' }}</p>
                            <button
                                v-for="person in searchResults"
                                :key="person.id"
                                @click="selectPerson(person)"
                                class="flex items-center gap-3 w-full p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left"
                            >
                                <div class="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300 font-semibold text-xs shrink-0">
                                    {{ getInitials(person) }}
                                </div>
                                <div class="flex-1 min-w-0">
                                    <p class="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate">
                                        {{ person.firstName }} {{ person.middleName || '' }} {{ person.lastName }}
                                    </p>
                                    <p v-if="person.birthDate" class="text-xs text-zinc-500 dark:text-zinc-400">
                                        Born {{ formatDate(person.birthDate) }}
                                    </p>
                                </div>
                                <span v-if="isInFamily(person)" class="text-xs text-amber-500 dark:text-amber-400 shrink-0">In tree</span>
                                <Icon v-else icon="lucide:plus" class="w-4 h-4 text-zinc-400 shrink-0" />
                            </button>
                        </div>

                        <!-- Prompt when empty -->
                        <div v-if="!searchQuery.trim() && !searching" class="text-center py-8">
                            <Icon icon="lucide:search" class="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
                            <p class="text-sm text-zinc-500 dark:text-zinc-400">Search for a person by name</p>
                            <p class="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                                Find existing people and add them to this family tree
                            </p>
                        </div>
                    </div>
                </template>
            </div>
        </div>
    </div>
</template>
