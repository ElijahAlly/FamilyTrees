import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import type { Page } from '../types/page';

export enum ShortcutSectionName {
    GLOBAL = 'Global',
    DISCOVER_SPLIT = 'Discover Split',
    FAMILY_TREE_PAGE = 'Family Tree Page'
}

type HotKeyOptions = '?' | 't' | 'd' // Global
    | 'l' | 'r' | 'ArrowLeft' | 'ArrowRight' // Discover Split
    | '_' | '+' | 'r' | 'a' | 'd' | 'w' | 's' // Family Tree Page (a, w, s, d) for moving
;

interface HotkeyConfig {
    key: HotKeyOptions;
    modifier?: 'shift' | 'ctrl' | 'alt' | 'meta';
    action: () => void;
    description: string;
    condition?: () => boolean;
    override?: boolean;
}

interface HotkeySection {
    name: ShortcutSectionName;
    hotkeys: HotkeyConfig[];
    active: boolean;
    activeOnPages: Page[];
}

interface HotkeyUpdates {
    action: () => void;
    condition?: () => boolean;
}

// Global hotkey registry
const hotkeyRegistry = ref(new Map<string, HotkeySection>());
const isProcessingHotkey = ref(false);

// Helper to create a unique key for the hotkey
// const createHotkeyKey = (key: string, modifier?: string) => modifier ? `${modifier}+${key}` : key;

export function useHotkeys() {
    // Set of all registered hotkey keys for quick lookup
    const activeHotkeyKeys = computed(() => {
        const keys = new Set<string>();
        for (const [_, section] of hotkeyRegistry.value) {
            if (section.active) {
                section.hotkeys.forEach(hotkey => keys.add(hotkey.key.toLowerCase()));
            }
        }
        return keys;
    });

    // Get all registered hotkeys for documentation
    const hotkeyList = computed(() => Array.from(hotkeyRegistry.value.values()));

    const registerHotkeys = (section: ShortcutSectionName, hotkeys: HotkeyConfig[], activeOnPages: Page[], active: boolean = true) => {
        hotkeyRegistry.value.set(section, { name: section, hotkeys, activeOnPages, active });
    };

    const unregisterHotkeys = (section: ShortcutSectionName) => {
        const hotKeyToDeactivate = hotkeyRegistry.value.get(section);
        hotkeyRegistry.value.delete(section);
        if (hotKeyToDeactivate?.hotkeys.length && hotKeyToDeactivate.activeOnPages?.length) {
            registerHotkeys(section, hotKeyToDeactivate.hotkeys, hotKeyToDeactivate.activeOnPages, false)
        }
    };

    const setHotkeysActions = (sectionName: ShortcutSectionName, actions: Partial<Record<HotKeyOptions, HotkeyUpdates>>) => {
        const section = hotkeyRegistry.value.get(sectionName);
        if (!section) return;

        const updatedHotkeys = section.hotkeys.map(hotkey => ({
            ...hotkey,
            action: actions[hotkey.key]?.action || hotkey.action,
            condition: actions[hotkey.key]?.condition || hotkey.condition
        }));
        
        hotkeyRegistry.value.set(sectionName, {
            ...section,
            active: true,
            hotkeys: updatedHotkeys
        });
    }

    const handleKeyPress = (event: KeyboardEvent) => {
        // ? The order of the base checks are important for performance.
        // Exit early, if we are currently processing a hotkey
        if (isProcessingHotkey.value
            // Or, if no modifier key is pressed since all hotkeys require one
            || !(event.shiftKey || event.ctrlKey || event.altKey || event.metaKey)
            // Or, if the user is typing in an input/textarea element
            || event.target instanceof HTMLInputElement 
            || event.target instanceof HTMLTextAreaElement
            // Or, if the pressed key isn't registered as a hotkey
            || !activeHotkeyKeys.value.has(event.key.toLowerCase())
        ) {
            return;
        }
    
        const pressedKey = event.key.toLowerCase();
        let hasMatchingOverride = false;
    
        // First check if there's an overriding hotkey that matches. If so, process hotkey
        for (const [_, section] of hotkeyRegistry.value) {
            if (!section.active) continue;

            for (const hotkey of section.hotkeys) {
                if (hotkey.key.toLowerCase() !== pressedKey) continue;
                
                if (hotkey.override && doesModifierMatch(event, hotkey)) {
                    hasMatchingOverride = true;
                    if (processHotkey(event, hotkey)) return;
                }
            }
        }
    
        // If there was an override matched, return early, else process regular hotkeys
        if (hasMatchingOverride) return;

        for (const [_, section] of hotkeyRegistry.value) {
            if (!section.active) continue;

            for (const hotkey of section.hotkeys) {
                if (hotkey.key.toLowerCase() !== pressedKey) continue;

                if (!hotkey.override && doesModifierMatch(event, hotkey)) {
                    processHotkey(event, hotkey);
                    return;
                }
            }
        }
    };

    const processHotkey = (event: KeyboardEvent, hotkey: HotkeyConfig): boolean => {
        if (!hotkey.condition || hotkey.condition()) {
            event.preventDefault();
            isProcessingHotkey.value = true;
            Promise.resolve(hotkey.action()).finally(() => {
                setTimeout(() => {
                    isProcessingHotkey.value = false;
                }, 100);
            });
            return true;
        }
        return false;
    }

    const doesModifierMatch = (event: KeyboardEvent, hotkey: HotkeyConfig): boolean => {
        return hotkey.modifier ? event[`${hotkey.modifier}Key`] : true;
    }

    const handleKeyPressHelper = useDebounceFn(handleKeyPress, 42);

    onMounted(() => {
        window.addEventListener('keydown', handleKeyPressHelper);
    });

    onUnmounted(() => {
        window.removeEventListener('keydown', handleKeyPressHelper);
    });
    
    return {
        registerHotkeys,
        unregisterHotkeys,
        setHotkeysActions,
        hotkeyList,
    };
}

/**
 * @summary EVERYTHING here will be overridden when the component mounts and registers the shortcuts.
 * @description This array is just to show all shortcuts before the component they are used in is loaded.
 */
export const listOfAllShortcuts: HotkeySection[] = [
    {
        name: ShortcutSectionName.GLOBAL, 
        hotkeys: [
            {
                key: '?',
                modifier: 'shift',
                description: 'Show/Hide keyboard shortcuts',
                action: () => {}  // Will be overridden when component mounts
            },
            {
                key: 't',
                modifier: 'shift',
                description: 'Scroll to top of page',
                action: () => {},  // Will be overridden when component mounts
                condition: () => false // Will be overridden when component mounts
            },
            {
                key: 'd',
                modifier: 'shift',
                description: 'Toggle dark mode',
                action: () => {},
            },
        ], 
        active: true,
        activeOnPages: [{ name: 'All', url: '/' }]
    },
    {
        name: ShortcutSectionName.DISCOVER_SPLIT,
        active: false,
        activeOnPages: [{ name: 'Discover', url: '/discover' }],
        hotkeys: [
            {
                key: 'l',
                modifier: 'shift',
                description: 'Toggle left panel',
                action: () => {}
            },
            {
                key: 'r',
                modifier: 'shift',
                description: 'Toggle right panel',
                action: () => {}
            },
            {
                key: 'ArrowLeft',
                description: 'Toggle left panel',
                action: () => {}
            },
            {
                key: 'ArrowRight',
                description: 'Toggle right panel',
                action: () => {}
            }
        ]
    },
    {
        name: ShortcutSectionName.FAMILY_TREE_PAGE,
        active: false,
        activeOnPages: [{ name: 'Family Tree View', url: '/:familyName/:familyId'}],
        hotkeys: [
            {
                key: 'r',
                modifier: 'shift',
                description: 'Reset Zooming and Panning',
                action: () => {},
                override: true
            },
            {
                key: '_',
                modifier: 'shift',
                description: 'Zoom out of tree',
                action: () => {}
            },
            {
                key: '+',
                modifier: 'shift',
                description: 'Zoom in tree',
                action: () => {}
            },
            {
                key: 'a',
                modifier: 'shift',
                description: 'Move family tree left',
                action: () => {}
            },
            {
                key: 'd',
                modifier: 'shift',
                description: 'Move family tree right',
                action: () => {},
                override: true
            },
            {
                key: 'w',
                modifier: 'shift',
                description: 'Move family tree up',
                action: () => {}
            },
            {
                key: 's',
                modifier: 'shift',
                description: 'Move family tree down',
                action: () => {}
            }
        ]
    },
];