<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { useDraggableZoneStore } from '@/stores/draggableZone';
import { storeToRefs } from 'pinia';
import {
  DropdownMenuArrow,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemIndicator,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  Separator
} from 'radix-vue';
   
const draggableZoneStore = useDraggableZoneStore();
const { updateCurBackgroundColor, updateShowSidebar, availableBackgroundColors, availableBackgroundPatterns } = draggableZoneStore;
const { showSidebar, curDisplayType, toggleSettings, curBackgroundColor, curBackgroundPattern } = storeToRefs(draggableZoneStore);

/** 
 * TODO: Allow for sidebar settings to be saved to a user
 *  - Allow for tree node colors to be changed (and saved)
 *  - Allow for tree border & shadow to be shown/hidden (and saved)
 *  - Allow for customization of tree node content:
 *    - First & Last Name
 *    - Birth/Death Date (or calculated age)
 *    - Profile picture (Option to only show this and name)
 *    - etc....
 *
 */
</script>

<template>
    <div v-show="showSidebar" class="absolute top-1/2 transform -translate-y-[42vh] left-6 flex flex-col rounded-md p-2 bg-white dark:bg-zinc-950 border hover:border-zinc-300 dark:border-zinc-600 dark:hover:border-zinc-400 z-20">
        <!-- <button :class="`bg-neutral-600 hover:bg-neutral-900 text-white rounded-md p-2 mr-2`" @click="updatePanzoomContent">Re-Center Everything</button> -->
        <!-- * Display as: Tree / Sunburst / Sankey / Treemap / List / etc. -->
        
        <!-- Tree Display Type -->
        <DropdownMenuRoot v-if="showSidebar">
            <DropdownMenuTrigger
                class="rounded-md border hover:border-zinc-300 dark:border-zinc-600 dark:hover:border-zinc-400 inline-flex items-center justify-center shadow-sm hover:shadow-md outline-none focus:shadow-md p-2 mb-2"
                aria-label="Customise options"
            >
                <Icon :icon="curDisplayType" class="w-9 h-9 text-black dark:text-white" />
                <div
                    class="ml-auto pl-1 group-data-[highlighted]:text-white group-data-[disabled]:text-mauve8"
                >
                    <Icon icon="radix-icons:chevron-right" class="text-black dark:text-white" />
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuPortal>
                <DropdownMenuContent
                    class="z-40 outline-none bg-white rounded-md p-3 shadow-md will-change-[opacity,transform] data-[side=top]:animate-slideDownAndFade data-[side=right]:animate-slideLeftAndFade data-[side=right]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade"
                    :side-offset="2"
                    side="right"
                >
                    <DropdownMenuRadioGroup v-model="curDisplayType" class="flex flex-col">
                        <DropdownMenuRadioItem
                            :class="`rounded-md border max-w-fit h-fit items-center justify-center p-3 my-1 ${curDisplayType === 'mdi:family-tree' ? 'bg-zinc-300' : 'bg-white'} shadow-sm hover:shadow-md text-[13px] leading-none text-black relative select-none outline-none data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:text-green1`"
                            value="mdi:family-tree"
                        >
                            <Icon icon="mdi:family-tree" class="w-9 h-9" />
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem
                            :class="`rounded-md border max-w-fit h-fit items-center justify-center p-3 my-1 ${curDisplayType === 'arcticons:graphene-os' ? 'bg-zinc-300' : 'bg-white'} shadow-sm hover:shadow-md text-[13px] leading-none text-black relative select-none outline-none data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:text-green1`"
                            value="arcticons:graphene-os"
                        >
                            <Icon icon="arcticons:graphene-os" class="w-9 h-9" />
                        </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
            </DropdownMenuPortal>
        </DropdownMenuRoot>

        <!-- Search For Person in Tree -->
        <!-- <DropdownMenuRoot>

        </DropdownMenuRoot> -->

        <!-- Settings -->
        <DropdownMenuRoot v-model:open="toggleSettings">
            <DropdownMenuTrigger
                class="border hover:border-zinc-300 dark:border-zinc-600 dark:hover:border-zinc-400 rounded-md inline-flex items-center justify-center shadow-sm hover:shadow-md outline-none focus:shadow-md my-2 p-3"
                aria-label="Customise options"
            >
                <Icon icon="fluent:settings-16-regular" class="w-9 h-9 text-black dark:text-white" />
                <div
                    class="ml-auto pl-1 group-data-[highlighted]:text-white group-data-[disabled]:text-mauve8"
                >
                    <Icon icon="radix-icons:chevron-right" class="text-black dark:text-white" />
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuPortal>
                <DropdownMenuContent
                    class="flex flex-col items-center justify-center z-40 min-w-[220px] outline-none bg-white dark:bg-zinc-950 border hover:border-zinc-300 dark:border-zinc-600 dark:hover:border-zinc-400 rounded-md p-[5px] shadow-md will-change-[opacity,transform] data-[side=top]:animate-slideDownAndFade data-[side=right]:animate-slideLeftAndFade data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade"
                    :side-offset="10"
                    side="right"
                >

                    <!-- Background Colors -->
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger
                            value="Background Color"
                            class="group w-full dark:text-white text-[13px] hover:bg-slate-100 dark:hover:bg-slate-800 leading-none text-grass11 rounded-[3px] flex items-center h-[25px] px-[5px] relative pl-[25px] select-none outline-none data-[state=open]:bg-green4 data-[state=open]:text-grass11 data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:bg-green9 data-[highlighted]:text-green1 data-[highlighted]:data-[state=open]:bg-green9 data-[highlighted]:data-[state=open]:text-green1"
                        >
                            Background Color
                            <div
                                class="ml-auto pl-[20px] text-mauve11 group-data-[disabled]:text-mauve8"
                            >
                                <Icon icon="radix-icons:chevron-right" />
                            </div>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent
                                class="min-w-[220px] outline-none bg-white dark:bg-zinc-950 rounded-md p-[5px] will-change-[opacity,transform] data-[side=top]:animate-slideDownAndFade data-[side=right]:animate-slideLeftAndFade data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade shadow-md border hover:border-zinc-300 dark:border-zinc-600 dark:hover:border-zinc-400"
                                :side-offset="5"
                                :align-offset="-5"
                            >
                                <DropdownMenuRadioGroup class="max-h-56 overflow-y-auto">
                                    <DropdownMenuRadioItem
                                        v-model="curBackgroundColor"
                                        v-for="(bgColor, i) in availableBackgroundColors"
                                        :class="`text-[13px] leading-none rounded-[3px] flex items-center h-12 p-4 relative pl-[25px] mb-1 select-none outline-none data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:text-green1`"
                                        :value="bgColor.name"
                                        :key="i"
                                        @click.stop="() => updateCurBackgroundColor(bgColor)"
                                        :style="{ 
                                            backgroundColor: bgColor.hex,
                                            color: bgColor.name === 'White' ? '#00000' : '#ffffff',
                                            borderColor: bgColor.name === 'White' ? '#00000' : 'transparent',
                                        }"
                                    >
                                        <DropdownMenuItemIndicator 
                                            v-if="curBackgroundColor.name === bgColor.name" 
                                            class="absolute left-0 w-[25px] inline-flex items-center justify-center" 
                                            :style="{
                                                color: bgColor.name === 'White' ? '#00000' : '#ffffff',
                                            }"
                                        >
                                            <Icon name="check" icon="radix-icons:check text-inherit" />
                                        </DropdownMenuItemIndicator>
                                        {{ bgColor.name }}
                                    </DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>

                    <!-- Separator -->
                    <DropdownMenuSeparator class="min-h-[1px] w-full bg-slate-100 dark:bg-slate-800 m-2" />

                    <!-- Background Patterns -->
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger
                            value="Background Pattern"
                            class="group w-full dark:text-white text-[13px] hover:bg-slate-100 dark:hover:bg-slate-800 leading-none text-grass11 rounded-[3px] flex items-center h-[25px] px-[5px] relative pl-[25px] select-none outline-none data-[state=open]:bg-green4 data-[state=open]:text-grass11 data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:bg-green9 data-[highlighted]:text-green1 data-[highlighted]:data-[state=open]:bg-green9 data-[highlighted]:data-[state=open]:text-green1"
                        >
                            Background Pattern
                            <div
                                class="ml-auto pl-[20px] text-mauve11 group-data-[disabled]:text-mauve8"
                            >
                                <Icon icon="radix-icons:chevron-right" />
                            </div>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent
                                class="min-w-[220px] outline-none bg-white dark:bg-zinc-950 rounded-md p-[5px] will-change-[opacity,transform] data-[side=top]:animate-slideDownAndFade data-[side=right]:animate-slideLeftAndFade data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade shadow-md border hover:border-zinc-300 dark:border-zinc-600 dark:hover:border-zinc-400"
                                :side-offset="5"
                                :align-offset="-5"
                            >
                                <DropdownMenuRadioGroup class="max-h-56 overflow-y-auto" v-model="curBackgroundPattern">
                                    <DropdownMenuRadioItem
                                        v-for="(background, i) in availableBackgroundPatterns"
                                        class="dark:text-white text-[13px] leading-none rounded-[3px] flex items-center h-12 p-4 relative pl-[25px] mb-1 select-none outline-none data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:text-green1"
                                        :value="background"
                                        :key="i"
                                    >
                                        <DropdownMenuItemIndicator class="absolute left-0 w-[25px] inline-flex items-center justify-center">
                                            <Icon icon="radix-icons:check" />
                                        </DropdownMenuItemIndicator>
                                        {{ background }} 
                                    </DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>

                    <!-- 
                        TODO: Add functionality to search for a person in the tree 

                        Option 1:
                        - - -
                        1. Set the selected person in the personStore to a new value then... 
                        2. Find that person's location in the FamilyTree.vue then... 
                        3. Set the location value in the personStore then... 
                        4. Zoom to that person in the [familyId].vue) (with panzoom)

                        Option 2:
                        - - -
                        1. Create a `Find Person in Tree` btn in the PersonInfoSidebar then...
                            a) The btn should use d3 to zoom to the correct person in the tree
                        2. Set the selected person in the personStore to `selectedPersonInTree` then...
                        3. Auto-click that `Find Person in Tree` btn
                    -->
                </DropdownMenuContent>
            </DropdownMenuPortal>
        </DropdownMenuRoot>
        
        <Separator
            class="bg-zinc-200 dark:bg-zinc-600 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px my-[15px]"
        />

        <!-- Collapse Sidebar Btn -->
        <div @click="() => updateShowSidebar(!showSidebar)" class="flex items-center justify-center shadow-sm rounded-md hover:shadow-md cursor-pointer p-2 border hover:border-zinc-300 dark:border-zinc-600 dark:hover:border-zinc-400 text-black dark:text-white">
            <Icon icon="radix-icons:chevron-left" />
        </div>
    </div>

    <!-- Expand Sidebar Btn -->
    <div 
        v-show="!showSidebar" 
        class="h-9 w-9 flex items-center justify-center cursor-pointer absolute top-1/2 transform -translate-y-[42vh] left-6 rounded-md bg-white dark:bg-zinc-950 border-2 hover:border-zinc-300 dark:border-zinc-600 dark:hover:border-zinc-400 z-30"
        @click="() => updateShowSidebar(!showSidebar)" 
    >
        <Icon icon="radix-icons:chevron-right" class="text-lg text-black dark:text-white" />
    </div>
</template>