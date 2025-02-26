<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useFamilyStore } from '@/stores/family';
import { storeToRefs } from 'pinia';
import { type FamilyTreeNodeType } from '@/types/family';
import { useWatchFamilyStore } from '@/composables/useWatchFamilyStore';
import FamilyTreeDropdown from './FamilyTreeDropdown.vue';
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue';

const familyStore = useFamilyStore();
const { setCurrentFamilyTree } = familyStore;
const { family, familyTrees, searchedForFamily } = storeToRefs(familyStore);

const handleFamilyClick = (familyTree: FamilyTreeNodeType) => {
    setCurrentFamilyTree(familyTree);
}

useWatchFamilyStore();
</script>

<template>
    <div class="relative w-full h-full my-3 flex flex-col items-center">
        <div v-if="family && searchedForFamily" class="absolute top-0 left-0 flex items-center justify-center h-56 w-full">
            <LoadingSpinner />
        </div>
        <p v-else-if="family && familyTrees.length === 0 && !searchedForFamily" class="text-zinc-950 dark:text-zinc-50">
            No familes found. Please modify your search or
            <NuxtLink to="/create">
                <span class="text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 underline underline-offset-1 hover:underline-offset-2 font-light cursor-pointer transition-all duration-300">Create Your Tree</span>
            </NuxtLink>
        </p>
        <div v-else class="w-full" v-for="(familyTreeNode, i) in familyTrees" :key="familyTreeNode.familyId">
            <div class="w-full border border-zinc-950 dark:border-zinc-100 rounded-md hover:shadow-md hover:shadow-zinc-300 dark:hover:shadow-zinc-600 p-3 mb-6">
                <div class="w-fit max-w-56 py-1 px-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-300 cursor-pointer hover:underline hover:underline-offset-4">
                    <NuxtLink 
                        class="w-fit flex items-center justify-center" 
                        :to="{ 
                            name: 'familyName-familyId', 
                            params: { 
                                familyName: familyTreeNode.member.last_name, 
                                familyId: familyTreeNode.familyId 
                            }
                        }" 
                        @click="() => handleFamilyClick(familyTreeNode)"
                    >
                        <p class="flex flex-nowrap mr-2">Go to family tree</p>
                        <Icon icon="grommet-icons:link-next" class="w-3 h-3"/>
                    </NuxtLink>
                </div>
                <FamilyTreeDropdown :treeNode="familyTreeNode" />
            </div>
        </div>
    </div>
</template>