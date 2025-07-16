<script setup lang="ts">
import { ref, computed } from 'vue';
import { ShortcutSectionName, useHotkeys } from '@/composables/useHotkeys';
import Modal from './ui/Modal.vue';
import Toggle from './ui/Toggle.vue';
import { Icon } from '@iconify/vue';

const props = defineProps({
    isOpen: { type: Boolean, default: false, required: false },
});

const emit = defineEmits<{
    'update:isOpen': [value: boolean];
}>();

const { hotkeyList } = useHotkeys();
const showInactive = ref(false);
const isExpanded = ref<{[key: string]: boolean}>({});

// Get mounted components' hotkey sections
const activeHotkeys = computed(() => hotkeyList.value.filter(section => section.active));

// Get unmounted components' hotkey sections
const inactiveHotkeys = computed(() => hotkeyList.value.filter(section => !section.active));

// TODO: Add searchbar for any shortcut. Once the input is focused, allow Shift to be pressed and add the text to the searchbar.
</script>

<template>
    <Modal :isOpen="isOpen" @update:isOpen="(val) => emit('update:isOpen', val)" width="max-w-2xl">
        <div class="space-y-6 overflow-y-auto max-h-[60vh]">
            <div class="flex items-center justify-between">
                <h3 class="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    Keyboard Shortcuts
                </h3>
            </div>

            <!-- Active Shortcuts -->
            <div class="space-y-6">
                <div v-for="section in activeHotkeys" :key="section.name" class="space-y-3">
                    <div class="flex w-full justify-between border-b border-zinc-200 dark:border-zinc-700">
                        <h4 class="flex items-center gap-1 p-1 rounded-sm text-lg font-medium text-zinc-900 dark:text-zinc-100 cursor-pointer hover:bg-zinc-200/50 dark:hover:bg-zinc-600/30"
                            :class="{'w-full': section.name !== ShortcutSectionName.GLOBAL, 'w-3/5': section.name === ShortcutSectionName.GLOBAL }"
                            @click.stop="isExpanded[section.name] = !(!!isExpanded[section.name])"
                            :title="`${isExpanded[section.name] ? 'Collapse' : 'Expand'} ${section.name} section`"
                        >
                            <Icon icon="bxs:up-arrow" :class="['w-4 h-4', {'rotate-180': isExpanded[section.name]}, {'rotate-90': !isExpanded[section.name]}]" />
                            {{ section.name }}
                        </h4>
                        <div v-if="section.name === 'Global'" class="flex items-center gap-2">
                            <span class="min-w-fit text-sm text-zinc-600 dark:text-zinc-400">
                                Show inactive shortcuts
                            </span>
                            <Toggle v-model="showInactive" darkVariant
                                title="Show inactive shortcuts available on other pages" />
                        </div>
                    </div>
                    <ul v-show="isExpanded[section.name]" class="space-y-2 overflow-y-auto max-h-48">
                        <li v-for="hotkey in section.hotkeys" :key="hotkey.description"
                            class="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
                            <span class="text-zinc-700 dark:text-zinc-300">
                                {{ hotkey.description }}
                            </span>
                            <kbd
                                class="px-2 py-1 bg-zinc-100 dark:bg-zinc-700 rounded text-zinc-700 dark:text-zinc-300 font-mono text-sm">
                                {{ hotkey.modifier ? `${hotkey.modifier}+${hotkey.key === '+' ? '"+"' : hotkey.key}`.toUpperCase() : hotkey.key.toUpperCase() }}
                            </kbd>
                        </li>
                    </ul>
                </div>
            </div>

            <!-- Inactive Shortcuts -->
            <div v-if="showInactive && inactiveHotkeys.length > 0" class="space-y-6">
                <div class="border-t border-dashed border-zinc-200 dark:border-zinc-700 pt-3">
                    <h3 class="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-4">
                        Inactive Shortcuts
                        <span class="text-sm text-zinc-500 dark:text-zinc-400">(not available on the current page)</span>
                    </h3>

                    <div v-for="section in inactiveHotkeys" :key="section.name" class="space-y-3 mb-6">
                        <h4
                            class="flex items-center gap-1 p-1 text-md font-medium text-zinc-400 dark:text-zinc-500 rounded-sm border-b border-zinc-200 dark:border-zinc-700 cursor-pointer hover:bg-zinc-200/50 dark:hover:bg-zinc-600/30" 
                            @click.stop="isExpanded[section.name] = !(!!isExpanded[section.name])"
                            :title="`${isExpanded[section.name] ? 'Collapse' : 'Expand'} ${section.name} section`"
                        >
                            <Icon icon="bxs:up-arrow" :class="['w-4 h-4', {'rotate-180': isExpanded[section.name]}, {'rotate-90': !isExpanded[section.name]}]" />
                            {{ section.name }} | Available on:
                            <span v-for="(page, index) in section.activeOnPages" :key="page.name">
                                {{ page.name }}{{ index < section.activeOnPages.length - 1 ? ' & ' : '' }}
                            </span>
                        </h4>
                        <ul v-show="isExpanded[section.name]" class="space-y-2 overflow-y-auto max-h-48">
                            <li v-for="hotkey in section.hotkeys" :key="hotkey.description"
                                class="flex items-center justify-between text-sm p-2 rounded-lg">
                                <span class="text-zinc-500 dark:text-zinc-400">
                                    {{ hotkey.description }}
                                </span>
                                <kbd
                                    class="px-2 py-1 bg-zinc-100 dark:bg-zinc-700 rounded text-zinc-500 dark:text-zinc-400 font-mono text-sm">
                                    {{ hotkey.modifier ? `${hotkey.modifier}+${hotkey.key === '+' ? '"+"' : hotkey.key}`.toUpperCase() : hotkey.key.toUpperCase() }}
                                </kbd>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </Modal>
</template>