<script setup lang="ts">
import { ref, type PropType, watch, nextTick } from 'vue';
import { Icon } from '@iconify/vue';
import { storeToRefs } from 'pinia';
import { useFamilyStore } from '@/stores/family';
import { usePersonStore } from '@/stores/person';
import type { FamilyType } from '@/types/family';
import type { FetchTypeList } from '@/types/fetch';
import { type PersonType } from '@/types/person';
import { getFullName } from '@/utils/person';

const familyStore = useFamilyStore();
const { setFamily, setSearchedForFamily, updateFamilies, searchedInputChanged } = familyStore;
const { family: familyFromStore, searchedInput } = storeToRefs(familyStore);
const personStore = usePersonStore();
const userInput = ref(searchedInput.value);
const userInputedCharAndDidNotClickOnResult = ref(false);
const families = ref<FamilyType[]>([]);
const people = ref<PersonType[]>([]);

const searchInputEle = ref<HTMLInputElement | null>(null);
const selectedIndex = ref(-1);
const loadingResults = ref(false);

const { title, searchBy } = defineProps({
    title: { type: String, default: '' },
    searchBy: { type: String as PropType<'families' | 'people' | 'all'>, default: 'all', required: false }
});

const placeholder = searchBy === 'families' ? 'Enter Family Name (Your last name)...' : searchBy === 'people' ? 'Search for a person by their first, middle, and last name' : 'Search by family or person name';
const familiesByName = ref<Map<string, FamilyType>>(new Map());

watch(userInput, async (newInput) => {
    const alreadySearchedForFamily = familyFromStore.value?.family_name === newInput;

    if (newInput && !loadingResults.value && !alreadySearchedForFamily) {
        userInputedCharAndDidNotClickOnResult.value = true;
        try {
            // Already sorted alphabetically from supabase
            const { data: response, error }: FetchTypeList<FamilyType | PersonType> = await $fetch('/api/get-all-matching-by-name', {
                method: 'GET',
                params: {
                    table: searchBy === 'families' ? 'families' : 'people',
                    select: '*',
                    ilike: searchBy === 'families' ? 'family_name' : null, // we don't need this for people search
                    name: newInput,
                    searchBy: searchBy
                }
            });

            if (error) throw error;

            if (response?.length) {
                if (searchBy === 'families') {
                    (response as FamilyType[]).forEach((family: FamilyType) => {
                        familiesByName.value.set(family.family_name, family);
                    });

                    const removeDuplicateFamilyNames = (families: FamilyType[]): FamilyType[] => {
                        const seenFamilyNames = new Set();
                        return families.filter(family => {
                            if (!seenFamilyNames.has(family.family_name)) {
                                seenFamilyNames.add(family.family_name);
                                return true; // Keep the first occurrence
                            }
                            return false; // Filter out duplicates
                        });
                    };

                    families.value = removeDuplicateFamilyNames(response as FamilyType[]) as FamilyType[]; 
                } else if (searchBy === 'people') {
                    people.value = response as PersonType[];
                }
            } else {
                families.value = [];
                people.value = [];
            }
        } catch (err) {
            console.error(err);
        }
    } else {
        if (!alreadySearchedForFamily) {
            families.value = [];
        }
    }
});

const handleKeydown = (e: KeyboardEvent) => {
    if (!userInput.value) {
        selectedIndex.value = -1;
        return;
    }

    const items = searchBy === 'families' ? families.value : people.value;

    switch (e.key) {
        case 'ArrowDown':
            e.preventDefault();
            selectedIndex.value = selectedIndex.value < items.length - 1 ? selectedIndex.value + 1 : 0;
            break;
        case 'ArrowUp':
            e.preventDefault();
            selectedIndex.value = selectedIndex.value > 0 ? selectedIndex.value - 1 : items.length - 1;
            break;
        case 'Enter':
            e.preventDefault();
            const indexToSearchBy = selectedIndex.value >= 0 ? selectedIndex.value : 0;
            if (searchBy === 'families') {
                handleFamilyNameClick(families.value[indexToSearchBy]);
            } else if (searchBy === 'people') {
                handlePersonClick(people.value[indexToSearchBy]);
            }
            break;
    }
}

const setLoadingResultsFalse = () =>  {
    loadingResults.value = false;
}

const handleClearInput = () => {
    userInput.value = '';
    searchedInputChanged('');
    userInputedCharAndDidNotClickOnResult.value = false;
    loadingResults.value = false;

    selectedIndex.value = -1;
    // Focus the input after clearing
    searchInputEle.value?.focus();
}

const handleFamilyNameClick = (family: FamilyType) => {
    userInputedCharAndDidNotClickOnResult.value = false;
    userInput.value = family.family_name;

    // Already fetched results for this family
    if (family.family_name === familyFromStore.value?.family_name) return;

    loadingResults.value = true;
    searchedInputChanged(family.family_name);
    setSearchedForFamily(true);
    setFamily(family);

    const familyFromDb = familiesByName.value.get(family.family_name);
    if (familyFromDb) {
        updateFamilies(familyFromDb);
        return;
    }
}

const handlePersonClick = (person: PersonType) => {
    loadingResults.value = true;
    // To get a list of people with this name, Query the db by first, (and middle if the option clicked on has a middle name) and last name 
    userInputedCharAndDidNotClickOnResult.value = false;
    userInput.value = getFullName(person) || userInput.value;
    personStore.setPerson(person);
    personStore.setSearchedForPerson(true);
}
</script>

<template>
    <div class="w-full h-full flex flex-col items-center">
        <h1 class="text-xl my-3 dark:text-white">
            {{ title }}
        </h1>
        <ComboboxRoot class="relative w-full flex flex-col items-center" :open="userInputedCharAndDidNotClickOnResult">
            <ComboboxAnchor
                :class="`w-3/5 min-w-[160px] rounded-md border border-zinc-950 dark:border-zinc-100 text-[14px] leading-none h-[35px] text-grass11 shadow-sm hover:shadow-md hover:bg-mauve3 focus:shadow-lg data-[placeholder]:text-grass9 outline-none ${userInput.length ? 'shadow-none hover:shadow-none' : ''}`">
                <div class="relative h-full w-full">
                    <input 
                        ref="searchInputEle"
                        v-model="userInput"
                        @keydown="handleKeydown"
                        @click="setLoadingResultsFalse"
                        class="!bg-transparent px-2 py-1 outline-none text-grass11 h-full w-full selection:bg-grass5 placeholder-mauve8 border-none dark:text-white"
                        :placeholder="placeholder" 
                    />
                        <Icon 
                            icon="mdi:clear-outline"
                            v-if="userInput.length > 0" 
                            class="absolute top-0 right-9 cursor-pointer dark:text-white hover:text-red-500 dark:hover:text-red-500 h-9 w-9 p-1" 
                            @click="handleClearInput"
                        />
                </div>
            </ComboboxAnchor>

            <ComboboxContent
                v-if="userInput.length > 0"
                class="absolute z-10 w-3/5 overflow-y-hidden mt-10 min-w-[160px] overflow-hidden rounded shadow-md dark:shadow-zinc-300 bg-white dark:bg-zinc-950 data-[side=top]:animate-slideDownAndFade data-[side=right]:animate-slideLeftAndFade data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade">
                <ComboboxViewport class="p-[5px] max-h-28 overflow-y-auto dark:text-white scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-zinc-600 dark:scrollbar-track-zinc-800">
                   
                    <!-- Families Dropdown -->
                    <ComboboxGroup v-if="searchBy === 'families'" class="pt-2">
                        <ComboboxItem value="none-found" v-if="families.length === 0">
                            <span>
                                No familes have the last name `{{ userInput }}`. Please modify your search or
                                <NuxtLink to="/create">
                                    <span class="text-zinc-500 dark:text-zinc-200 underline underline-offset-1 hover:underline-offset-2 font-light cursor-pointer">Create Your Tree</span>
                                </NuxtLink>
                            </span>
                        </ComboboxItem>
                        <ComboboxItem 
                            v-else 
                            v-for="(family, index) in families" 
                            :key="index"
                            class="text-[13px] leading-none text-grass11 rounded-[3px] flex items-center h-[25px] pr-[35px] pl-[25px] relative select-none hover:bg-neutral-200 dark:hover:bg-neutral-700 data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:outline-none data-[highlighted]:bg-grass9 data-[highlighted]:text-grass1"
                            :class="{ 'bg-neutral-200 dark:bg-neutral-700': selectedIndex === index }"
                            :value="family.family_name" 
                            @click="() => handleFamilyNameClick(family)"
                        >
                            <span>
                                {{ family.family_name }}
                            </span>
                        </ComboboxItem>
                        <ComboboxSeparator class="h-[1px] bg-grass6 m-[5px]" />
                    </ComboboxGroup>

                    <!-- People Dropdown -->
                    <ComboboxGroup v-if="searchBy === 'people'" class="overflow-y-auto max-h-30 pt-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-zinc-600 dark:scrollbar-track-zinc-800">
                        <ComboboxItem value="none-found" v-if="people.length === 0">
                            <span>
                                No people have the name `{{ userInput }}`. Please modify your search or
                                <NuxtLink to="/create">
                                    <span class="text-zinc-500 dark:text-zinc-200 underline underline-offset-1 hover:underline-offset-2 font-light cursor-pointer">Create Your Tree</span>
                                </NuxtLink>
                            </span>
                        </ComboboxItem>
                        <ComboboxItem 
                            v-else 
                            v-for="(person, index) in people" 
                            :key="index"
                            class="text-[13px] leading-none text-grass11 rounded-[3px] flex items-center h-[25px] pr-[35px] pl-[25px] relative select-none hover:bg-neutral-200 dark:hover:bg-neutral-700 data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:outline-none data-[highlighted]:bg-grass9 data-[highlighted]:text-grass1"
                            :class="{ 'bg-neutral-200 dark:bg-neutral-700': selectedIndex === index }"
                            :value="getFullName(person)" 
                            @click="() => handlePersonClick(person)"
                        >
                            <span>
                                {{ getFullName(person) }}
                            </span>
                        </ComboboxItem>
                        <ComboboxSeparator class="h-[1px] bg-grass6 m-[5px]" />
                    </ComboboxGroup>

                </ComboboxViewport>
            </ComboboxContent>
        </ComboboxRoot>
    </div>
</template>