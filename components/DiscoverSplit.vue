<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { SplitterGroup, SplitterPanel } from 'radix-vue';
import { ref } from 'vue';
import SearchFamilyTrees from './family/SearchFamilyTrees.vue';
import FamilyResults from './family/FamilyResults.vue';

type SectionViewType = {
    [key: number]: {
        isFullPage: boolean
    }
}

const _defaultSectionViews = {
    0: {
        isFullPage: false
    },
    1: {
        isFullPage: false
    }
}

const sectionViews = ref<SectionViewType>(_defaultSectionViews);
const isTransitioning = ref(false);

const handleToggleFullPage = (index: number) => {
    isTransitioning.value = true;
    
    
    if (sectionViews.value[index].isFullPage) { // If we're collapsing a section, just toggle it
        sectionViews.value[index].isFullPage = false;
    } 
    else { // If we're expanding a section, reset others first
        if (isAnySectionFullPage()) {
            resetSectionViewsSize();
            // Add small delay before expanding the clicked section
            setTimeout(() => {
                sectionViews.value[index].isFullPage = true;
            }, 50);
        } else {
            sectionViews.value[index].isFullPage = true;
        }
    }

    // Reset transition state after animation completes
    setTimeout(() => {
        isTransitioning.value = false;
    }, 300); // Match this with your transition duration
}

const resetSectionViewsSize = () => {
    Object.keys(sectionViews.value).forEach((key) => {
        sectionViews.value[Number(key)].isFullPage = false;
    });
}

const resetSectionViews = () => {
    sectionViews.value = _defaultSectionViews;
}

const isAnySectionFullPage = () => {
    return Object.keys(sectionViews.value).some((key) => {
        return sectionViews.value[Number(key)].isFullPage
    });
}

const handlePanelClick = (index: number) => {
    if (!sectionViews.value[index].isFullPage && isAnySectionFullPage()) {
        resetSectionViewsSize();
    }
}
</script>

<template>
    <div class="w-full h-[75%] bg-transparent">
        <div class="w-full h-full px-8 text-green9 font-medium text-sm bg-transparent">
            <SplitterGroup id="splitter-group-1" direction="horizontal" class="h-full bg-transparent">
                <SplitterPanel
                    id="splitter-group-1-panel-1"
                    :min-size="sectionViews[0].isFullPage ? 88 : 10"
                    class="relative border w-full h-full min-h-96 rounded-xl border-zinc-950 dark:border-zinc-100 flex flex-col items-center mr-3 overflow-y-auto px-6 py-2 transition-all duration-300 ease-in-out"
                    @click.stop="handlePanelClick(0)"
                >
                    <div
                        v-if="isAnySectionFullPage() && !sectionViews[0].isFullPage"
                        class="flex justify-between items-center w-full h-full absolute top-0 left-0 text-black bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-900 hover:dark:bg-zinc-700 cursor-pointer dark:text-white transition-all duration-300"
                    >
                        <p class="w-full text-center">Click to expand</p>
                    </div>
                    <div v-else class="relative w-full h-full flex flex-col">
                        <div
                            class=" self-end text-zinc-950 dark:text-zinc-50 cursor-pointer hover:bg-zinc-800 hover:text-zinc-50 dark:hover:text-zinc-950 dark:hover:bg-zinc-200 transition-colors duration-300 rounded-sm py-0 px-1"
                            :title="sectionViews[0].isFullPage ? 'Collapse section' : 'Expand to full page'"
                            @click.stop="handleToggleFullPage(0)"
                        >
                            <Icon
                                :icon="sectionViews[0].isFullPage ? 'ri:collapse-horizontal-line' : 'ri:expand-horizontal-line'" 
                                class="w-7 h-7"
                            />
                        </div>
                        <SearchFamilyTrees title="Search for your family trees by last name" searchBy="families" />
                        <!-- Should handle families with the same last name by showing the people in the family with a non-visual tree (nested dropdowns, but it should be reversed, starting from the youngest person) -->
                        <FamilyResults />
                    </div>
                </SplitterPanel>
                <SplitterPanel 
                    id="splitter-group-1-panel-2" 
                    :min-size="sectionViews[1].isFullPage ? 90 : 12"
                    class="relative transition-all duration-300 ease-in-out"
                >
                    <!-- <div class="absolute top-0 right-0 text-zinc-950 dark:text-zinc-50 cursor-pointer hover:bg-zinc-900 hover:text-zinc-50 dark:hover:text-zinc-950 dark:hover:bg-zinc-200 transition-colors duration-300 rounded-sm py-0 px-1"></div> -->
                    <SplitterGroup id="splitter-group-2" direction="vertical">
                        <SplitterPanel
                            id="splitter-group-2-panel-1" 
                            :min-size="sectionViews[1].isFullPage ? 100 : 80"
                            class="flex flex-col relative border rounded-xl items-center justify-center border-zinc-950 dark:border-zinc-100 px-6 py-2"
                            @click.stop="handlePanelClick(1)"
                        >
                            <div
                                v-if="isAnySectionFullPage() && !sectionViews[1].isFullPage"
                                class="flex justify-between items-center w-full h-full absolute top-0 left-0 text-black bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-900 hover:dark:bg-zinc-700 cursor-pointer dark:text-white transition-colors duration-300"
                            >
                                <p class="w-full text-center">Click to expand</p>
                            </div>
                            <div v-else class="relative w-full h-full flex flex-col items-center">
                                <div
                                    class="self-end text-zinc-950 dark:text-zinc-50 cursor-pointer hover:bg-zinc-800 hover:text-zinc-50 dark:hover:text-zinc-950 dark:hover:bg-zinc-200 transition-colors duration-300 rounded-sm py-0 px-1"
                                    :title="sectionViews[1].isFullPage ? 'Collapse section' : 'Expand to full page'"
                                    @click.stop="handleToggleFullPage(1)"
                                >
                                    <Icon
                                        :icon="sectionViews[1].isFullPage ? 'ri:collapse-horizontal-line' : 'ri:expand-horizontal-line'" 
                                        class="w-7 h-7"
                                    />
                                </div>
                                <!-- ! FIX: Search for people - by first name, middle name, last name, or a combination of the three. -->
                                <SearchFamilyTrees title="Search for a person by their full name" searchBy="people" />
                                <NuxtLink
                                    v-if="sectionViews[1].isFullPage"
                                    class="w-fit flex items-center justify-center mx-3 border border-zinc-500 dark:border-zinc-400 text-zinc-700 dark:text-zinc-300 rounded-md hover:bg-zinc-200 dark:hover:text-zinc-950 dark:hover:border-zinc-950 transition-colors duration-300 p-2" 
                                    to="/create"
                                >
                                    <p class="flex flex-nowrap">Create New Family Tree</p>
                                </NuxtLink>
                            </div>
                        </SplitterPanel>
                        <div v-if="!sectionViews[1].isFullPage" class="h-3 w-3"></div>
                        <SplitterPanel 
                            id="splitter-group-2-panel-2" 
                            :min-size="sectionViews[1].isFullPage ? 0 : 20"
                            class="border rounded-xl flex items-center justify-center border-zinc-950 dark:border-zinc-100"
                            :class="{'border-none': sectionViews[1].isFullPage}"
                        >
                            <NuxtLink 
                                class="w-fit flex items-center justify-center mx-3 border border-zinc-500 dark:border-zinc-400 text-zinc-700 dark:text-zinc-300 rounded-md hover:bg-zinc-200 dark:hover:text-zinc-950 dark:hover:border-zinc-950 transition-colors duration-300 p-2" 
                                to="/create"
                            >
                                <p class="flex flex-nowrap">Create New Family Tree</p>
                            </NuxtLink>
                        </SplitterPanel>
                    </SplitterGroup>
                </SplitterPanel>
            </SplitterGroup>
        </div>
    </div>
</template>

<style scoped>
.transition-all {
    transition-property: all, min-width, min-height;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 300ms;
}

:deep(.splitter-panel) {
    transition: min-width 300ms ease-in-out,
    min-height 300ms ease-in-out,
    width 300ms ease-in-out,
    height 300ms ease-in-out;
}

/* Smooth transition for the splitter handle */
:deep(.splitter-handle) {
    transition: left 300ms ease-in-out, top 300ms ease-in-out;
}
</style>