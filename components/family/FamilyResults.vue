<script setup lang="ts">
import { ref, computed } from 'vue';
import { Icon } from '@iconify/vue'
import { useFamilyStore } from '@/stores/useFamily';
import { storeToRefs } from 'pinia';
import type { FamilyTreeNodeType, FamilyType } from '@/types';
import { useWatchFamilyStore } from '@/composables/useWatchFamilyStore';
import FamilyTreeDropdown from './FamilyTreeDropdown.vue';
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue';

const familyStore = useFamilyStore();
const { setCurrentFamilyTree } = familyStore;
const { family, familyTrees, searchedForFamily } = storeToRefs(familyStore);

const authStore = useAuthStore();
const { user, profile } = storeToRefs(authStore);

const showJoinModal = ref(false);
const joinModalFamily = ref<FamilyType | null>(null);
const joinMode = ref<'join' | 'add_self'>('join');

const handleFamilyClick = (familyTree: FamilyTreeNodeType) => {
    setCurrentFamilyTree(familyTree);
}

const handleJoinFamily = (familyData: FamilyType, mode: 'join' | 'add_self') => {
    joinModalFamily.value = familyData;
    joinMode.value = mode;
    showJoinModal.value = true;
};

// Check if the user is already a member of a given family
const isUserMemberOf = (familyId: number): boolean => {
    if (!user.value) return false;
    const claimsStore = useClaimsStore();
    return claimsStore.activeMemberships.some(m => m.familyId === familyId);
};

const hasPendingRequestFor = (familyId: number): boolean => {
    if (!user.value) return false;
    const claimsStore = useClaimsStore();
    return claimsStore.myClaims.some(c => c.familyId === familyId && c.status === 'pending');
};

useWatchFamilyStore();
</script>

<template>
    <div class="relative w-full h-full my-3 flex flex-col items-center">
        <div v-if="family && searchedForFamily" class="absolute top-0 left-0 flex items-center justify-center h-56 w-full">
            <LoadingSpinner />
        </div>
        <p v-else-if="family && familyTrees.length === 0 && !searchedForFamily" class="text-zinc-950 dark:text-zinc-50">
            No families found. Please modify your search or
            <NuxtLink to="/create">
                <span class="text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 underline underline-offset-1 hover:underline-offset-2 font-light cursor-pointer transition-all duration-300">Create Your Tree</span>
            </NuxtLink>
        </p>
        <div v-else class="w-full" v-for="(familyTreeNode, i) in familyTrees" :key="familyTreeNode.familyId">
            <div class="w-full border border-zinc-950 dark:border-zinc-100 rounded-md hover:shadow-md hover:shadow-zinc-300 dark:hover:shadow-zinc-600 p-3 mb-6">
                <div class="flex items-center justify-between mb-2">
                    <div class="w-fit max-w-56 py-1 px-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-300 cursor-pointer hover:underline hover:underline-offset-4">
                        <NuxtLink
                            class="w-fit flex items-center justify-center"
                            :to="{
                                name: 'familyName-familyId',
                                params: {
                                    familyName: familyTreeNode.member.lastName,
                                    familyId: familyTreeNode.familyId
                                }
                            }"
                            @click="() => handleFamilyClick(familyTreeNode)"
                        >
                            <p class="flex flex-nowrap mr-2">Go to family tree</p>
                            <Icon icon="grommet-icons:link-next" class="w-3 h-3"/>
                        </NuxtLink>
                    </div>

                    <!-- Join/Claim buttons for logged-in users -->
                    <div v-if="user && family" class="flex gap-2">
                        <span v-if="isUserMemberOf(familyTreeNode.familyId)" class="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 px-2 py-1">
                            <Icon icon="mdi:check-circle" class="w-4 h-4" />
                            Member
                        </span>
                        <span v-else-if="hasPendingRequestFor(familyTreeNode.familyId)" class="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 px-2 py-1">
                            <Icon icon="mdi:clock-outline" class="w-4 h-4" />
                            Pending
                        </span>
                        <template v-else>
                            <button
                                @click.stop="handleJoinFamily(family, 'add_self')"
                                class="text-xs px-3 py-1 border border-emerald-500 text-emerald-600 dark:text-emerald-400 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                            >
                                Add Myself
                            </button>
                            <button
                                @click.stop="handleJoinFamily(family, 'join')"
                                class="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            >
                                Join Family
                            </button>
                        </template>
                    </div>
                </div>
                <FamilyTreeDropdown :treeNode="familyTreeNode" />
            </div>
        </div>

        <!-- Not logged in prompt -->
        <div v-if="!user && family && familyTrees.length > 0" class="w-full text-center mt-4">
            <p class="text-sm text-zinc-500 dark:text-zinc-400 mb-2">
                Want to join this family or claim a person?
            </p>
            <NuxtLink
                to="/signup?existing=true"
                class="text-sm text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-200"
            >
                Login or Sign Up
            </NuxtLink>
        </div>

        <!-- Join Family Modal -->
        <FamilyJoinFamilyModal
            v-if="joinModalFamily"
            :family="joinModalFamily"
            :show="showJoinModal"
            :mode="joinMode"
            @close="showJoinModal = false"
            @joined="showJoinModal = false"
        />
    </div>
</template>
