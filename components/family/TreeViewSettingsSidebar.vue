<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { useDraggableZoneStore } from '@/stores/useDraggableZone';
import { storeToRefs } from 'pinia';
import {
  DropdownMenuContent,
  DropdownMenuItemIndicator,
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

const { isMobile } = useDevice();

const draggableZoneStore = useDraggableZoneStore();
const { updateCurBackgroundColor, updateShowSidebar, updateTreeCustomization, resetTreeCustomization, availableBackgroundColors, availableBackgroundPatterns } = draggableZoneStore;
const { showSidebar, curDisplayType, toggleSettings, curBackgroundColor, curBackgroundPattern, treeCustomization } = storeToRefs(draggableZoneStore);

const MENU_ITEM_CLASS = "group w-full dark:text-white text-[13px] hover:bg-slate-100 dark:hover:bg-slate-800 leading-none rounded-md flex items-center h-[32px] px-[8px] relative pl-[28px] select-none outline-none data-[state=open]:bg-slate-100 dark:data-[state=open]:bg-slate-800 data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:bg-slate-100 dark:data-[highlighted]:bg-slate-800";
const SUB_CONTENT_CLASS = "min-w-[240px] outline-none bg-white dark:bg-zinc-950 rounded-lg p-[6px] will-change-[opacity,transform] data-[side=top]:animate-slideDownAndFade data-[side=right]:animate-slideLeftAndFade data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade shadow-lg border border-zinc-200 dark:border-zinc-700";
</script>

<template>
    <!-- Desktop: vertical sidebar on the left -->
    <div v-if="!isMobile" v-show="showSidebar" class="absolute top-1/2 transform -translate-y-[42vh] left-6 flex flex-col rounded-md p-2 bg-white dark:bg-zinc-950 border hover:border-zinc-300 dark:border-zinc-600 dark:hover:border-zinc-400 z-20">
        <!-- Tree Display Type -->
        <DropdownMenuRoot v-if="showSidebar">
            <DropdownMenuTrigger
                class="rounded-md border hover:border-zinc-300 dark:border-zinc-600 dark:hover:border-zinc-400 inline-flex items-center justify-center shadow-sm hover:shadow-md outline-none focus:shadow-md p-2 mb-2"
                aria-label="Customise options"
            >
                <Icon :icon="curDisplayType" class="w-8 h-8 text-black dark:text-white" />
                <div
                    class="ml-auto pl-1 group-data-[highlighted]:text-white group-data-[disabled]:text-mauve8"
                >
                    <Icon icon="lucide:chevron-right" class="text-black dark:text-white" />
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

        <!-- Settings -->
        <DropdownMenuRoot v-model:open="toggleSettings">
            <DropdownMenuTrigger
                class="border hover:border-zinc-300 dark:border-zinc-600 dark:hover:border-zinc-400 rounded-md inline-flex items-center justify-center shadow-sm hover:shadow-md outline-none focus:shadow-md my-2 p-3"
                aria-label="Customise options"
            >
                <Icon icon="lucide:settings" class="w-8 h-8 text-black dark:text-white" />
                <div
                    class="ml-auto pl-1 group-data-[highlighted]:text-white group-data-[disabled]:text-mauve8"
                >
                    <Icon icon="lucide:chevron-right" class="text-black dark:text-white" />
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuPortal>
                <DropdownMenuContent
                    class="flex flex-col items-stretch z-40 min-w-[240px] max-h-[80vh] overflow-y-auto outline-none bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg p-[6px] shadow-lg will-change-[opacity,transform] data-[side=top]:animate-slideDownAndFade data-[side=right]:animate-slideLeftAndFade data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade"
                    :side-offset="10"
                    side="right"
                    :avoid-collisions="true"
                    :collision-padding="12"
                >

                    <!-- Background Colors -->
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger
                            value="Background Color"
                            :class="MENU_ITEM_CLASS"
                        >
                            <Icon icon="lucide:palette" class="absolute left-[6px] w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                            Background Color
                            <div class="ml-auto pl-[20px] flex items-center gap-1">
                                <span class="w-4 h-4 rounded-full border-2 border-zinc-300 dark:border-zinc-500 inline-block" :style="{ backgroundColor: curBackgroundColor.hex }" />
                                <Icon icon="lucide:chevron-right" class="w-3.5 h-3.5 text-zinc-400" />
                            </div>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent
                                :class="SUB_CONTENT_CLASS"
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
                                            color: bgColor.name === 'White' ? '#000000' : '#ffffff',
                                            borderColor: bgColor.name === 'White' ? '#000000' : 'transparent',
                                        }"
                                    >
                                        <DropdownMenuItemIndicator
                                            v-if="curBackgroundColor.name === bgColor.name"
                                            class="absolute left-0 w-[25px] inline-flex items-center justify-center"
                                            :style="{
                                                color: bgColor.name === 'White' ? '#000000' : '#ffffff',
                                            }"
                                        >
                                            <Icon icon="lucide:check" class="text-inherit" />
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
                            :class="MENU_ITEM_CLASS"
                        >
                            <Icon icon="lucide:grid-3x3" class="absolute left-[6px] w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                            Background Pattern
                            <div class="ml-auto pl-[20px]">
                                <Icon icon="lucide:chevron-right" class="w-3.5 h-3.5 text-zinc-400" />
                            </div>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent
                                :class="SUB_CONTENT_CLASS"
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
                                            <Icon icon="lucide:check" />
                                        </DropdownMenuItemIndicator>
                                        {{ background }}
                                    </DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>

                    <!-- Separator -->
                    <DropdownMenuSeparator class="min-h-[1px] w-full bg-slate-100 dark:bg-slate-800 m-2" />

                    <!-- Node Color -->
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger :class="MENU_ITEM_CLASS">
                            <Icon icon="lucide:square" class="absolute left-[6px] w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                            Node Color
                            <div class="ml-auto pl-[20px] flex items-center gap-1">
                                <span class="w-4 h-4 rounded border-2 border-zinc-300 dark:border-zinc-500 inline-block" :style="{ backgroundColor: treeCustomization.nodeColor }" />
                                <Icon icon="lucide:chevron-right" class="w-3.5 h-3.5 text-zinc-400" />
                            </div>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent :class="SUB_CONTENT_CLASS" :side-offset="5" :align-offset="-5">
                                <div class="p-3 space-y-3">
                                    <label class="flex items-center gap-2 text-sm dark:text-white">
                                        <input
                                            type="color"
                                            aria-label="Node background color"
                                            :value="treeCustomization.nodeColor"
                                            @input="(e) => updateTreeCustomization('nodeColor', (e.target as HTMLInputElement).value)"
                                            class="w-8 h-8 rounded-md cursor-pointer border-2 border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-400 bg-transparent p-0.5"
                                        />
                                        Node Background
                                    </label>
                                    <label class="flex items-center gap-2 text-sm dark:text-white">
                                        <input
                                            type="color"
                                            aria-label="Node border color"
                                            :value="treeCustomization.nodeStrokeColor"
                                            @input="(e) => updateTreeCustomization('nodeStrokeColor', (e.target as HTMLInputElement).value)"
                                            class="w-8 h-8 rounded-md cursor-pointer border-2 border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-400 bg-transparent p-0.5"
                                        />
                                        Node Border
                                    </label>
                                    <label class="flex items-center gap-2 text-sm dark:text-white">
                                        <input
                                            type="color"
                                            aria-label="Text color"
                                            :value="treeCustomization.nodeTextColor"
                                            @input="(e) => updateTreeCustomization('nodeTextColor', (e.target as HTMLInputElement).value)"
                                            class="w-8 h-8 rounded-md cursor-pointer border-2 border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-400 bg-transparent p-0.5"
                                        />
                                        Text Color
                                    </label>

                                    <DropdownMenuSeparator class="min-h-[1px] w-full bg-slate-100 dark:bg-slate-800" />

                                    <label class="flex items-center gap-2 text-sm dark:text-white cursor-pointer">
                                        <input
                                            type="checkbox"
                                            :checked="treeCustomization.useAltColorForDiffLastName"
                                            @change="(e) => updateTreeCustomization('useAltColorForDiffLastName', (e.target as HTMLInputElement).checked)"
                                            class="rounded"
                                        />
                                        Different color for other last names
                                    </label>
                                    <label v-if="treeCustomization.useAltColorForDiffLastName" class="flex items-center gap-2 text-sm dark:text-white pl-4">
                                        <input
                                            type="color"
                                            aria-label="Alternate node color"
                                            :value="treeCustomization.altNodeColor"
                                            @input="(e) => updateTreeCustomization('altNodeColor', (e.target as HTMLInputElement).value)"
                                            class="w-8 h-8 rounded-md cursor-pointer border-2 border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-400 bg-transparent p-0.5"
                                        />
                                        Alt Node Color
                                    </label>
                                </div>
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>

                    <!-- Connector Lines -->
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger :class="MENU_ITEM_CLASS">
                            <Icon icon="lucide:minus" class="absolute left-[6px] w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                            Connector Lines
                            <div class="ml-auto pl-[20px] flex items-center gap-1">
                                <span class="w-4 h-4 rounded border-2 border-zinc-300 dark:border-zinc-500 inline-block" :style="{ backgroundColor: treeCustomization.connectorColor }" />
                                <Icon icon="lucide:chevron-right" class="w-3.5 h-3.5 text-zinc-400" />
                            </div>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent :class="SUB_CONTENT_CLASS" :side-offset="5" :align-offset="-5">
                                <div class="p-3 space-y-3">
                                    <label class="flex items-center gap-2 text-sm dark:text-white">
                                        <input
                                            type="color"
                                            aria-label="Connector line color"
                                            :value="treeCustomization.connectorColor"
                                            @input="(e) => updateTreeCustomization('connectorColor', (e.target as HTMLInputElement).value)"
                                            class="w-8 h-8 rounded-md cursor-pointer border-2 border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-400 bg-transparent p-0.5"
                                        />
                                        Line Color
                                    </label>
                                    <label class="flex flex-col gap-1 text-sm dark:text-white">
                                        <span>Line Width: {{ treeCustomization.connectorWidth }}px</span>
                                        <input
                                            type="range"
                                            aria-label="Connector line width"
                                            min="1"
                                            max="8"
                                            step="1"
                                            :value="treeCustomization.connectorWidth"
                                            @input="(e) => updateTreeCustomization('connectorWidth', Number((e.target as HTMLInputElement).value))"
                                            class="w-full cursor-pointer"
                                        />
                                    </label>
                                </div>
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>

                    <!-- Hover Shadow -->
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger :class="MENU_ITEM_CLASS">
                            <Icon icon="lucide:layers" class="absolute left-[6px] w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                            Node Shadow
                            <div class="ml-auto pl-[20px]">
                                <Icon icon="lucide:chevron-right" class="w-3.5 h-3.5 text-zinc-400" />
                            </div>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent :class="SUB_CONTENT_CLASS" :side-offset="5" :align-offset="-5">
                                <DropdownMenuRadioGroup
                                    :model-value="treeCustomization.hoverShadow"
                                    @update:model-value="(v: any) => updateTreeCustomization('hoverShadow', v)"
                                >
                                    <DropdownMenuRadioItem
                                        v-for="option in [
                                            { value: 'off', label: 'Off' },
                                            { value: 'hover', label: 'Show on Hover' },
                                            { value: 'always', label: 'Always Show' },
                                        ]"
                                        :key="option.value"
                                        :value="option.value"
                                        class="dark:text-white text-[13px] leading-none rounded-[3px] flex items-center h-10 p-4 relative pl-[25px] mb-1 select-none outline-none data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:bg-slate-100 dark:data-[highlighted]:bg-slate-800"
                                    >
                                        <DropdownMenuItemIndicator class="absolute left-0 w-[25px] inline-flex items-center justify-center">
                                            <Icon icon="lucide:check" />
                                        </DropdownMenuItemIndicator>
                                        {{ option.label }}
                                    </DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>

                    <!-- Avatar / Image Background -->
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger :class="MENU_ITEM_CLASS">
                            <Icon icon="lucide:image" class="absolute left-[6px] w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                            Image Background
                            <div class="ml-auto pl-[20px] flex items-center gap-1">
                                <span class="w-4 h-4 rounded-full border-2 border-zinc-300 dark:border-zinc-500 inline-block" :style="{ backgroundColor: treeCustomization.avatarBgColor }" />
                                <Icon icon="lucide:chevron-right" class="w-3.5 h-3.5 text-zinc-400" />
                            </div>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent :class="SUB_CONTENT_CLASS" :side-offset="5" :align-offset="-5">
                                <div class="p-3 space-y-3">
                                    <label class="flex items-center gap-2 text-sm dark:text-white">
                                        <input
                                            type="color"
                                            aria-label="Avatar background color"
                                            :value="treeCustomization.avatarBgColor"
                                            @input="(e) => updateTreeCustomization('avatarBgColor', (e.target as HTMLInputElement).value)"
                                            class="w-8 h-8 rounded-md cursor-pointer border-2 border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-400 bg-transparent p-0.5"
                                        />
                                        Avatar Background
                                    </label>
                                    <label class="flex items-center gap-2 text-sm dark:text-white cursor-pointer">
                                        <input
                                            type="checkbox"
                                            :checked="treeCustomization.avatarBgTransparentWhenImage"
                                            @change="(e) => updateTreeCustomization('avatarBgTransparentWhenImage', (e.target as HTMLInputElement).checked)"
                                            class="rounded"
                                        />
                                        Transparent when photo present
                                    </label>
                                </div>
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>

                    <!-- Grid Dot Color (only when dot-background is selected) -->
                    <DropdownMenuSub v-if="curBackgroundPattern === 'dot-background'">
                        <DropdownMenuSubTrigger :class="MENU_ITEM_CLASS">
                            <Icon icon="lucide:circle-dot" class="absolute left-[6px] w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                            Grid Dot Color
                            <div class="ml-auto pl-[20px] flex items-center gap-1">
                                <span class="w-4 h-4 rounded-full border-2 border-zinc-300 dark:border-zinc-500 inline-block" :style="{ backgroundColor: treeCustomization.gridDotColor }" />
                                <Icon icon="lucide:chevron-right" class="w-3.5 h-3.5 text-zinc-400" />
                            </div>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent :class="SUB_CONTENT_CLASS" :side-offset="5" :align-offset="-5">
                                <div class="p-3">
                                    <label class="flex items-center gap-2 text-sm dark:text-white">
                                        <input
                                            type="color"
                                            aria-label="Grid dot color"
                                            :value="treeCustomization.gridDotColor"
                                            @input="(e) => updateTreeCustomization('gridDotColor', (e.target as HTMLInputElement).value)"
                                            class="w-8 h-8 rounded-md cursor-pointer border-2 border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-400 bg-transparent p-0.5"
                                        />
                                        Dot Color
                                    </label>
                                </div>
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>

                    <!-- Pulse Color -->
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger :class="MENU_ITEM_CLASS">
                            <Icon icon="lucide:sparkles" class="absolute left-[6px] w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                            Highlight Color
                            <div class="ml-auto pl-[20px] flex items-center gap-1">
                                <span class="w-4 h-4 rounded border-2 border-zinc-300 dark:border-zinc-500 inline-block" :style="{ backgroundColor: treeCustomization.pulseColor }" />
                                <Icon icon="lucide:chevron-right" class="w-3.5 h-3.5 text-zinc-400" />
                            </div>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent :class="SUB_CONTENT_CLASS" :side-offset="5" :align-offset="-5">
                                <div class="p-3">
                                    <label class="flex items-center gap-2 text-sm dark:text-white">
                                        <input
                                            type="color"
                                            aria-label="Highlight pulse color"
                                            :value="treeCustomization.pulseColor"
                                            @input="(e) => updateTreeCustomization('pulseColor', (e.target as HTMLInputElement).value)"
                                            class="w-8 h-8 rounded-md cursor-pointer border-2 border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-400 bg-transparent p-0.5"
                                        />
                                        Find-in-tree pulse color
                                    </label>
                                </div>
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>

                    <!-- Spouse Display -->
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger :class="MENU_ITEM_CLASS">
                            <Icon icon="lucide:heart" class="absolute left-[6px] w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                            Spouse Display
                            <div class="ml-auto pl-[20px]">
                                <Icon icon="lucide:chevron-right" class="w-3.5 h-3.5 text-zinc-400" />
                            </div>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent :class="SUB_CONTENT_CLASS" :side-offset="5" :align-offset="-5">
                                <p class="px-3 pt-2 pb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">Ex-Partner Visibility</p>
                                <DropdownMenuRadioGroup
                                    :model-value="treeCustomization.exSpouseDisplay"
                                    @update:model-value="(v: any) => updateTreeCustomization('exSpouseDisplay', v)"
                                >
                                    <DropdownMenuRadioItem
                                        v-for="option in [
                                            { value: 'indicator', label: 'Show Indicator Badge' },
                                            { value: 'always', label: 'Always Show' },
                                            { value: 'hidden', label: 'Hidden' },
                                        ]"
                                        :key="option.value"
                                        :value="option.value"
                                        class="dark:text-white text-[13px] leading-none rounded-md flex items-center h-10 p-4 relative pl-[25px] mb-1 select-none outline-none data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:bg-slate-100 dark:data-[highlighted]:bg-slate-800"
                                    >
                                        <DropdownMenuItemIndicator class="absolute left-0 w-[25px] inline-flex items-center justify-center">
                                            <Icon icon="lucide:check" />
                                        </DropdownMenuItemIndicator>
                                        {{ option.label }}
                                    </DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>

                    <!-- Group Children by Gender -->
                    <button
                        @click="updateTreeCustomization('groupChildrenByGender', !treeCustomization.groupChildrenByGender)"
                        :class="MENU_ITEM_CLASS"
                    >
                        <Icon icon="lucide:users" class="absolute left-[6px] w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                        Group by Gender
                        <div class="ml-auto pl-[20px]">
                            <Icon
                                :icon="treeCustomization.groupChildrenByGender ? 'lucide:toggle-right' : 'lucide:toggle-left'"
                                :class="['w-5 h-5', treeCustomization.groupChildrenByGender ? 'text-emerald-500' : 'text-zinc-400']"
                            />
                        </div>
                    </button>

                    <!-- Separator -->
                    <DropdownMenuSeparator class="min-h-[1px] w-full bg-slate-100 dark:bg-slate-800 m-2" />

                    <!-- Reset All -->
                    <button
                        @click="resetTreeCustomization"
                        class="w-full text-[13px] hover:bg-red-50 dark:hover:bg-red-950 text-red-600 dark:text-red-400 leading-none rounded-md flex items-center h-[32px] px-[8px] pl-[28px] select-none outline-none relative"
                    >
                        <Icon icon="lucide:rotate-ccw" class="absolute left-[6px] w-4 h-4" />
                        Reset to Defaults
                    </button>
                </DropdownMenuContent>
            </DropdownMenuPortal>
        </DropdownMenuRoot>

        <Separator
            class="bg-zinc-200 dark:bg-zinc-600 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px my-[15px]"
        />

        <!-- Collapse Sidebar Btn -->
        <div @click="() => updateShowSidebar(!showSidebar)" role="button" tabindex="0" aria-label="Collapse sidebar" class="flex items-center justify-center shadow-sm rounded-md hover:shadow-md cursor-pointer p-2 border hover:border-zinc-300 dark:border-zinc-600 dark:hover:border-zinc-400 text-black dark:text-white">
            <Icon icon="lucide:chevron-left" />
        </div>
    </div>

    <!-- Desktop: Expand Sidebar Btn -->
    <div
        v-if="!isMobile"
        v-show="!showSidebar"
        role="button"
        tabindex="0"
        aria-label="Expand sidebar"
        class="h-9 w-9 flex items-center justify-center cursor-pointer absolute top-1/2 transform -translate-y-[42vh] left-6 rounded-md bg-white dark:bg-zinc-950 border-2 hover:border-zinc-300 dark:border-zinc-600 dark:hover:border-zinc-400 z-30"
        @click="() => updateShowSidebar(!showSidebar)"
    >
        <Icon icon="lucide:chevron-right" class="text-lg text-black dark:text-white" />
    </div>

    <!-- Mobile: bottom toolbar -->
    <div v-if="isMobile" class="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-xl p-1.5 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-sm border border-zinc-200 dark:border-zinc-700 shadow-lg z-20">
        <!-- Tree Display Type -->
        <DropdownMenuRoot>
            <DropdownMenuTrigger
                class="rounded-lg border border-zinc-200 dark:border-zinc-700 inline-flex items-center justify-center shadow-sm active:shadow-md outline-none p-2.5"
                aria-label="Display type"
            >
                <Icon :icon="curDisplayType" class="w-6 h-6 text-black dark:text-white" />
            </DropdownMenuTrigger>
            <DropdownMenuPortal>
                <DropdownMenuContent
                    class="z-40 outline-none bg-white dark:bg-zinc-950 rounded-lg p-2 shadow-lg border border-zinc-200 dark:border-zinc-700 will-change-[opacity,transform] data-[side=top]:animate-slideDownAndFade"
                    :side-offset="8"
                    side="top"
                    align="start"
                    :avoid-collisions="true"
                    :collision-padding="12"
                >
                    <DropdownMenuRadioGroup v-model="curDisplayType" class="flex gap-2">
                        <DropdownMenuRadioItem
                            :class="`rounded-lg border h-fit items-center justify-center p-2.5 ${curDisplayType === 'mdi:family-tree' ? 'bg-zinc-200 dark:bg-zinc-700' : 'bg-white dark:bg-zinc-900'} shadow-sm text-[13px] leading-none text-black dark:text-white relative select-none outline-none`"
                            value="mdi:family-tree"
                        >
                            <Icon icon="mdi:family-tree" class="w-7 h-7" />
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem
                            :class="`rounded-lg border h-fit items-center justify-center p-2.5 ${curDisplayType === 'arcticons:graphene-os' ? 'bg-zinc-200 dark:bg-zinc-700' : 'bg-white dark:bg-zinc-900'} shadow-sm text-[13px] leading-none text-black dark:text-white relative select-none outline-none`"
                            value="arcticons:graphene-os"
                        >
                            <Icon icon="arcticons:graphene-os" class="w-7 h-7" />
                        </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
            </DropdownMenuPortal>
        </DropdownMenuRoot>

        <Separator orientation="vertical" class="bg-zinc-200 dark:bg-zinc-600 w-px h-8" />

        <!-- Settings -->
        <DropdownMenuRoot v-model:open="toggleSettings">
            <DropdownMenuTrigger
                class="rounded-lg border border-zinc-200 dark:border-zinc-700 inline-flex items-center justify-center shadow-sm active:shadow-md outline-none p-2.5"
                aria-label="Settings"
            >
                <Icon icon="lucide:settings" class="w-6 h-6 text-black dark:text-white" />
            </DropdownMenuTrigger>
            <DropdownMenuPortal>
                <DropdownMenuContent
                    class="flex flex-col items-stretch z-40 min-w-[260px] max-h-[60vh] overflow-y-auto outline-none bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg p-[6px] shadow-lg will-change-[opacity,transform] data-[side=top]:animate-slideDownAndFade"
                    :side-offset="8"
                    side="top"
                    align="center"
                    :avoid-collisions="true"
                    :collision-padding="12"
                >

                    <!-- Background Colors -->
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger
                            value="Background Color"
                            :class="MENU_ITEM_CLASS"
                        >
                            <Icon icon="lucide:palette" class="absolute left-[6px] w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                            Background Color
                            <div class="ml-auto pl-[20px] flex items-center gap-1">
                                <span class="w-4 h-4 rounded-full border-2 border-zinc-300 dark:border-zinc-500 inline-block" :style="{ backgroundColor: curBackgroundColor.hex }" />
                                <Icon icon="lucide:chevron-right" class="w-3.5 h-3.5 text-zinc-400" />
                            </div>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent
                                :class="SUB_CONTENT_CLASS"
                                :side-offset="5"
                                :align-offset="-5"
                                :avoid-collisions="true"
                                :collision-padding="12"
                            >
                                <DropdownMenuRadioGroup class="max-h-48 overflow-y-auto">
                                    <DropdownMenuRadioItem
                                        v-model="curBackgroundColor"
                                        v-for="(bgColor, i) in availableBackgroundColors"
                                        :class="`text-[13px] leading-none rounded-[3px] flex items-center h-12 p-4 relative pl-[25px] mb-1 select-none outline-none data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:text-green1`"
                                        :value="bgColor.name"
                                        :key="i"
                                        @click.stop="() => updateCurBackgroundColor(bgColor)"
                                        :style="{
                                            backgroundColor: bgColor.hex,
                                            color: bgColor.name === 'White' ? '#000000' : '#ffffff',
                                            borderColor: bgColor.name === 'White' ? '#000000' : 'transparent',
                                        }"
                                    >
                                        <DropdownMenuItemIndicator
                                            v-if="curBackgroundColor.name === bgColor.name"
                                            class="absolute left-0 w-[25px] inline-flex items-center justify-center"
                                            :style="{
                                                color: bgColor.name === 'White' ? '#000000' : '#ffffff',
                                            }"
                                        >
                                            <Icon icon="lucide:check" class="text-inherit" />
                                        </DropdownMenuItemIndicator>
                                        {{ bgColor.name }}
                                    </DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>

                    <DropdownMenuSeparator class="min-h-[1px] w-full bg-slate-100 dark:bg-slate-800 m-2" />

                    <!-- Background Patterns -->
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger
                            value="Background Pattern"
                            :class="MENU_ITEM_CLASS"
                        >
                            <Icon icon="lucide:grid-3x3" class="absolute left-[6px] w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                            Background Pattern
                            <div class="ml-auto pl-[20px]">
                                <Icon icon="lucide:chevron-right" class="w-3.5 h-3.5 text-zinc-400" />
                            </div>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent
                                :class="SUB_CONTENT_CLASS"
                                :side-offset="5"
                                :align-offset="-5"
                                :avoid-collisions="true"
                                :collision-padding="12"
                            >
                                <DropdownMenuRadioGroup class="max-h-48 overflow-y-auto" v-model="curBackgroundPattern">
                                    <DropdownMenuRadioItem
                                        v-for="(background, i) in availableBackgroundPatterns"
                                        class="dark:text-white text-[13px] leading-none rounded-[3px] flex items-center h-12 p-4 relative pl-[25px] mb-1 select-none outline-none data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:text-green1"
                                        :value="background"
                                        :key="i"
                                    >
                                        <DropdownMenuItemIndicator class="absolute left-0 w-[25px] inline-flex items-center justify-center">
                                            <Icon icon="lucide:check" />
                                        </DropdownMenuItemIndicator>
                                        {{ background }}
                                    </DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>

                    <DropdownMenuSeparator class="min-h-[1px] w-full bg-slate-100 dark:bg-slate-800 m-2" />

                    <!-- Node Color -->
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger :class="MENU_ITEM_CLASS">
                            <Icon icon="lucide:square" class="absolute left-[6px] w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                            Node Color
                            <div class="ml-auto pl-[20px] flex items-center gap-1">
                                <span class="w-4 h-4 rounded border-2 border-zinc-300 dark:border-zinc-500 inline-block" :style="{ backgroundColor: treeCustomization.nodeColor }" />
                                <Icon icon="lucide:chevron-right" class="w-3.5 h-3.5 text-zinc-400" />
                            </div>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent :class="SUB_CONTENT_CLASS" :side-offset="5" :align-offset="-5" :avoid-collisions="true" :collision-padding="12">
                                <div class="p-3 space-y-3">
                                    <label class="flex items-center gap-2 text-sm dark:text-white">
                                        <input type="color" aria-label="Node background color" :value="treeCustomization.nodeColor" @input="(e) => updateTreeCustomization('nodeColor', (e.target as HTMLInputElement).value)" class="w-8 h-8 rounded-md cursor-pointer border-2 border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-400 bg-transparent p-0.5" />
                                        Node Background
                                    </label>
                                    <label class="flex items-center gap-2 text-sm dark:text-white">
                                        <input type="color" aria-label="Node border color" :value="treeCustomization.nodeStrokeColor" @input="(e) => updateTreeCustomization('nodeStrokeColor', (e.target as HTMLInputElement).value)" class="w-8 h-8 rounded-md cursor-pointer border-2 border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-400 bg-transparent p-0.5" />
                                        Node Border
                                    </label>
                                    <label class="flex items-center gap-2 text-sm dark:text-white">
                                        <input type="color" aria-label="Text color" :value="treeCustomization.nodeTextColor" @input="(e) => updateTreeCustomization('nodeTextColor', (e.target as HTMLInputElement).value)" class="w-8 h-8 rounded-md cursor-pointer border-2 border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-400 bg-transparent p-0.5" />
                                        Text Color
                                    </label>
                                    <DropdownMenuSeparator class="min-h-[1px] w-full bg-slate-100 dark:bg-slate-800" />
                                    <label class="flex items-center gap-2 text-sm dark:text-white cursor-pointer">
                                        <input type="checkbox" :checked="treeCustomization.useAltColorForDiffLastName" @change="(e) => updateTreeCustomization('useAltColorForDiffLastName', (e.target as HTMLInputElement).checked)" class="rounded" />
                                        Different color for other last names
                                    </label>
                                    <label v-if="treeCustomization.useAltColorForDiffLastName" class="flex items-center gap-2 text-sm dark:text-white pl-4">
                                        <input type="color" aria-label="Alternate node color" :value="treeCustomization.altNodeColor" @input="(e) => updateTreeCustomization('altNodeColor', (e.target as HTMLInputElement).value)" class="w-8 h-8 rounded-md cursor-pointer border-2 border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-400 bg-transparent p-0.5" />
                                        Alt Node Color
                                    </label>
                                </div>
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>

                    <!-- Connector Lines -->
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger :class="MENU_ITEM_CLASS">
                            <Icon icon="lucide:minus" class="absolute left-[6px] w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                            Connector Lines
                            <div class="ml-auto pl-[20px] flex items-center gap-1">
                                <span class="w-4 h-4 rounded border-2 border-zinc-300 dark:border-zinc-500 inline-block" :style="{ backgroundColor: treeCustomization.connectorColor }" />
                                <Icon icon="lucide:chevron-right" class="w-3.5 h-3.5 text-zinc-400" />
                            </div>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent :class="SUB_CONTENT_CLASS" :side-offset="5" :align-offset="-5" :avoid-collisions="true" :collision-padding="12">
                                <div class="p-3 space-y-3">
                                    <label class="flex items-center gap-2 text-sm dark:text-white">
                                        <input type="color" aria-label="Connector line color" :value="treeCustomization.connectorColor" @input="(e) => updateTreeCustomization('connectorColor', (e.target as HTMLInputElement).value)" class="w-8 h-8 rounded-md cursor-pointer border-2 border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-400 bg-transparent p-0.5" />
                                        Line Color
                                    </label>
                                    <label class="flex flex-col gap-1 text-sm dark:text-white">
                                        <span>Line Width: {{ treeCustomization.connectorWidth }}px</span>
                                        <input type="range" aria-label="Connector line width" min="1" max="8" step="1" :value="treeCustomization.connectorWidth" @input="(e) => updateTreeCustomization('connectorWidth', Number((e.target as HTMLInputElement).value))" class="w-full cursor-pointer" />
                                    </label>
                                </div>
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>

                    <!-- Hover Shadow -->
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger :class="MENU_ITEM_CLASS">
                            <Icon icon="lucide:layers" class="absolute left-[6px] w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                            Node Shadow
                            <div class="ml-auto pl-[20px]">
                                <Icon icon="lucide:chevron-right" class="w-3.5 h-3.5 text-zinc-400" />
                            </div>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent :class="SUB_CONTENT_CLASS" :side-offset="5" :align-offset="-5" :avoid-collisions="true" :collision-padding="12">
                                <DropdownMenuRadioGroup
                                    :model-value="treeCustomization.hoverShadow"
                                    @update:model-value="(v: any) => updateTreeCustomization('hoverShadow', v)"
                                >
                                    <DropdownMenuRadioItem
                                        v-for="option in [
                                            { value: 'off', label: 'Off' },
                                            { value: 'hover', label: 'Show on Hover' },
                                            { value: 'always', label: 'Always Show' },
                                        ]"
                                        :key="option.value"
                                        :value="option.value"
                                        class="dark:text-white text-[13px] leading-none rounded-[3px] flex items-center h-10 p-4 relative pl-[25px] mb-1 select-none outline-none data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:bg-slate-100 dark:data-[highlighted]:bg-slate-800"
                                    >
                                        <DropdownMenuItemIndicator class="absolute left-0 w-[25px] inline-flex items-center justify-center">
                                            <Icon icon="lucide:check" />
                                        </DropdownMenuItemIndicator>
                                        {{ option.label }}
                                    </DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>

                    <!-- Avatar / Image Background -->
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger :class="MENU_ITEM_CLASS">
                            <Icon icon="lucide:image" class="absolute left-[6px] w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                            Image Background
                            <div class="ml-auto pl-[20px] flex items-center gap-1">
                                <span class="w-4 h-4 rounded-full border-2 border-zinc-300 dark:border-zinc-500 inline-block" :style="{ backgroundColor: treeCustomization.avatarBgColor }" />
                                <Icon icon="lucide:chevron-right" class="w-3.5 h-3.5 text-zinc-400" />
                            </div>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent :class="SUB_CONTENT_CLASS" :side-offset="5" :align-offset="-5" :avoid-collisions="true" :collision-padding="12">
                                <div class="p-3 space-y-3">
                                    <label class="flex items-center gap-2 text-sm dark:text-white">
                                        <input type="color" aria-label="Avatar background color" :value="treeCustomization.avatarBgColor" @input="(e) => updateTreeCustomization('avatarBgColor', (e.target as HTMLInputElement).value)" class="w-8 h-8 rounded-md cursor-pointer border-2 border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-400 bg-transparent p-0.5" />
                                        Avatar Background
                                    </label>
                                    <label class="flex items-center gap-2 text-sm dark:text-white cursor-pointer">
                                        <input type="checkbox" :checked="treeCustomization.avatarBgTransparentWhenImage" @change="(e) => updateTreeCustomization('avatarBgTransparentWhenImage', (e.target as HTMLInputElement).checked)" class="rounded" />
                                        Transparent when photo present
                                    </label>
                                </div>
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>

                    <!-- Grid Dot Color -->
                    <DropdownMenuSub v-if="curBackgroundPattern === 'dot-background'">
                        <DropdownMenuSubTrigger :class="MENU_ITEM_CLASS">
                            <Icon icon="lucide:circle-dot" class="absolute left-[6px] w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                            Grid Dot Color
                            <div class="ml-auto pl-[20px] flex items-center gap-1">
                                <span class="w-4 h-4 rounded-full border-2 border-zinc-300 dark:border-zinc-500 inline-block" :style="{ backgroundColor: treeCustomization.gridDotColor }" />
                                <Icon icon="lucide:chevron-right" class="w-3.5 h-3.5 text-zinc-400" />
                            </div>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent :class="SUB_CONTENT_CLASS" :side-offset="5" :align-offset="-5" :avoid-collisions="true" :collision-padding="12">
                                <div class="p-3">
                                    <label class="flex items-center gap-2 text-sm dark:text-white">
                                        <input type="color" aria-label="Grid dot color" :value="treeCustomization.gridDotColor" @input="(e) => updateTreeCustomization('gridDotColor', (e.target as HTMLInputElement).value)" class="w-8 h-8 rounded-md cursor-pointer border-2 border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-400 bg-transparent p-0.5" />
                                        Dot Color
                                    </label>
                                </div>
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>

                    <!-- Pulse Color -->
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger :class="MENU_ITEM_CLASS">
                            <Icon icon="lucide:sparkles" class="absolute left-[6px] w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                            Highlight Color
                            <div class="ml-auto pl-[20px] flex items-center gap-1">
                                <span class="w-4 h-4 rounded border-2 border-zinc-300 dark:border-zinc-500 inline-block" :style="{ backgroundColor: treeCustomization.pulseColor }" />
                                <Icon icon="lucide:chevron-right" class="w-3.5 h-3.5 text-zinc-400" />
                            </div>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent :class="SUB_CONTENT_CLASS" :side-offset="5" :align-offset="-5" :avoid-collisions="true" :collision-padding="12">
                                <div class="p-3">
                                    <label class="flex items-center gap-2 text-sm dark:text-white">
                                        <input type="color" aria-label="Highlight pulse color" :value="treeCustomization.pulseColor" @input="(e) => updateTreeCustomization('pulseColor', (e.target as HTMLInputElement).value)" class="w-8 h-8 rounded-md cursor-pointer border-2 border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-400 bg-transparent p-0.5" />
                                        Find-in-tree pulse color
                                    </label>
                                </div>
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>

                    <!-- Spouse Display -->
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger :class="MENU_ITEM_CLASS">
                            <Icon icon="lucide:heart" class="absolute left-[6px] w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                            Spouse Display
                            <div class="ml-auto pl-[20px]">
                                <Icon icon="lucide:chevron-right" class="w-3.5 h-3.5 text-zinc-400" />
                            </div>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent :class="SUB_CONTENT_CLASS" :side-offset="5" :align-offset="-5" :avoid-collisions="true" :collision-padding="12">
                                <p class="px-3 pt-2 pb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">Ex-Partner Visibility</p>
                                <DropdownMenuRadioGroup
                                    :model-value="treeCustomization.exSpouseDisplay"
                                    @update:model-value="(v: any) => updateTreeCustomization('exSpouseDisplay', v)"
                                >
                                    <DropdownMenuRadioItem
                                        v-for="option in [
                                            { value: 'indicator', label: 'Show Indicator Badge' },
                                            { value: 'always', label: 'Always Show' },
                                            { value: 'hidden', label: 'Hidden' },
                                        ]"
                                        :key="option.value"
                                        :value="option.value"
                                        class="dark:text-white text-[13px] leading-none rounded-md flex items-center h-10 p-4 relative pl-[25px] mb-1 select-none outline-none data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:bg-slate-100 dark:data-[highlighted]:bg-slate-800"
                                    >
                                        <DropdownMenuItemIndicator class="absolute left-0 w-[25px] inline-flex items-center justify-center">
                                            <Icon icon="lucide:check" />
                                        </DropdownMenuItemIndicator>
                                        {{ option.label }}
                                    </DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>

                    <!-- Group Children by Gender -->
                    <button
                        @click="updateTreeCustomization('groupChildrenByGender', !treeCustomization.groupChildrenByGender)"
                        :class="MENU_ITEM_CLASS"
                    >
                        <Icon icon="lucide:users" class="absolute left-[6px] w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                        Group by Gender
                        <div class="ml-auto pl-[20px]">
                            <Icon
                                :icon="treeCustomization.groupChildrenByGender ? 'lucide:toggle-right' : 'lucide:toggle-left'"
                                :class="['w-5 h-5', treeCustomization.groupChildrenByGender ? 'text-emerald-500' : 'text-zinc-400']"
                            />
                        </div>
                    </button>

                    <DropdownMenuSeparator class="min-h-[1px] w-full bg-slate-100 dark:bg-slate-800 m-2" />

                    <!-- Reset All -->
                    <button
                        @click="resetTreeCustomization"
                        class="w-full text-[13px] hover:bg-red-50 dark:hover:bg-red-950 text-red-600 dark:text-red-400 leading-none rounded-md flex items-center h-[32px] px-[8px] pl-[28px] select-none outline-none relative"
                    >
                        <Icon icon="lucide:rotate-ccw" class="absolute left-[6px] w-4 h-4" />
                        Reset to Defaults
                    </button>
                </DropdownMenuContent>
            </DropdownMenuPortal>
        </DropdownMenuRoot>
    </div>
</template>
