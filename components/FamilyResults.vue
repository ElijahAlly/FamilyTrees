<script setup lang="ts">
import type { AutoStyleClass } from '@/types/auto-styles';
const autoStyleClass: AutoStyleClass = 'family-results-as';
import { Icon } from '@iconify/vue'
import { useFamilyStore } from '@/stores/family';
import { type FamilyTreeNodeType } from '@/types/family';
import { useWatchFamilyStore } from '@/composables/useWatchFamilyStore';

const familyStore = useFamilyStore();

const handleFamilyClick = (familyTree: FamilyTreeNodeType) => {
    familyStore.setCurrentFamilyTree(familyTree);
}

onMounted(() => {
    useWatchFamilyStore();
})
</script>

<template>
    <div class="relative w-full h-full my-3 flex flex-col items-center" :class="autoStyleClass">
        <div v-if="familyStore.family && familyStore.searchedForFamily" class="absolute top-0 left-0 flex items-center justify-center h-56 w-full">
            <Icon
                icon="eos-icons:bubble-loading"
                class="h-12 w-full text-zinc-500" 
            />
        </div>
        <p v-else-if="familyStore.family && familyStore.familyTrees.length === 0 && !familyStore.searchedForFamily">
            No familes found. Please modify your search or
            <NuxtLink to="/create">
                <span class="text-zinc-500 underline underline-offset-1 hover:underline-offset-2 font-light cursor-pointer">Create Your Tree</span>
            </NuxtLink>
        </p>
        <div v-else class="w-full" v-for="(familyTreeNode, i) in familyStore.familyTrees" :key="familyTreeNode.familyId">
            <div class="w-full border border-zinc-950 dark:border-zinc-100 rounded-md hover:shadow-md hover:shadow-zinc-300 dark:hover:shadow-zinc-600 p-3 mb-6">
                <div class="w-fit max-w-56 py-1 px-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-300 cursor-pointer hover:underline hover:underline-offset-4">
                    <NuxtLink class="w-fit flex items-center justify-center" :to="{ name: 'familyName-familyId', params: { familyName: familyTreeNode.member.last_name, familyId: familyTreeNode.familyId }}" @click="() => handleFamilyClick(familyTreeNode)">
                        <p class="flex flex-nowrap mr-2">Go to family tree</p>
                        <icon icon="grommet-icons:link-next" class="w-3 h-3"/>
                    </NuxtLink>
                </div>
                <FamilyTreeDropdown :treeNode="familyTreeNode" />
            </div>
        </div>
    </div>
</template>