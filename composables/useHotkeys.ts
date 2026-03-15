import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import type { Page } from '@/types';

export enum ShortcutSectionName {
    GLOBAL = 'Global',
    DISCOVER_SPLIT = 'Discover Split',
    FAMILY_TREE_PAGE = 'Family Tree Page',
    FAMILY_TREE_DETAILS = 'Family Tree Details',
    FAMILY_TREE_PERSON_DETAILS = 'Family Tree Person Details',
}

type HotKeyOptions = 
    // Global
    // (?) for showing shortcut helpers modal.
    // (t) for scrolling back to top of page.
    // (d) for toggling dark theme.
    '?' | 't' | 'd' 
    
    // Discover Split
    // (l or ArrowLeft, r or ArrowRight) for expanding/collapsing search sections.
    | 'l' | 'r' | 'ArrowLeft' | 'ArrowRight'

    // Family Tree Page 
    // (a, w, s, d) for panning. 
    // (_, +) for zooming.
    // (f) for showing family details. 
    // (p) for showing a person's details.
    | '_' | '+' | 'r' | 'a' | 'd' | 'w' | 's' | 'f' | 'p'
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

export interface HotkeyUpdates {
    action: () => void;
    condition?: () => boolean;
}

// Global hotkey registry
const hotkeyRegistry = ref(new Map<string, HotkeySection>());
const isProcessingHotkey = ref(false);

// Hotkey hint toast state
const HINT_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const hotkeyHintDismissed = ref(false);
let lastHintShownAt = 0;
const showHotkeyHint = ref(false);

/**
 * Initialize hint state from the user's profile preferences (call once after profile loads).
 */
function initHotkeyHintFromProfile(dismissed: boolean) {
    hotkeyHintDismissed.value = dismissed;
    if (dismissed) {
        showHotkeyHint.value = false;
    }
}

/**
 * Call this when the user performs an action via mouse/click that has a keyboard shortcut equivalent.
 * Shows a toast suggesting Shift+? if the user hasn't dismissed it and cooldown has passed.
 */
function notifyHotkeyAvailable() {
    if (hotkeyHintDismissed.value) return;
    // No keyboard shortcuts on mobile devices
    if (window.innerWidth <= 768) return;
    const now = Date.now();
    if (now - lastHintShownAt < HINT_COOLDOWN_MS) return;
    lastHintShownAt = now;
    showHotkeyHint.value = true;
}

/**
 * Called when the user uses Shift+? — permanently dismisses the hint
 * and persists the preference to the user's account.
 */
async function markHotkeyHintDismissed() {
    hotkeyHintDismissed.value = true;
    showHotkeyHint.value = false;

    // Persist to user account
    try {
        const authStore = useAuthStore();
        const user = authStore.user;
        if (user) {
            await $fetch('/api/auth/update-preferences', {
                method: 'POST',
                body: { userId: user.id, preferences: { hotkeyHintDismissed: true } },
            });
        }
    } catch {
        // Non-critical — hint is already dismissed in memory for this session
    }
}

function dismissHotkeyHint() {
    showHotkeyHint.value = false;
}

// Helper to create a unique key for the hotkey
// const createHotkeyKey = (key: string, modifier?: string) => modifier ? `${modifier}+${key}` : key;

export function useHotkeys(sectionName?: ShortcutSectionName, actions?: Partial<Record<HotKeyOptions, HotkeyUpdates>>) {
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

    const unregisterHotkeys = (sectionNameOverride?: ShortcutSectionName) => {
        const sectionNameVal: ShortcutSectionName | undefined = sectionNameOverride || sectionName;
        if (!sectionNameVal) return;
        const hotKeyToDeactivate = hotkeyRegistry.value.get(sectionNameVal);
        hotkeyRegistry.value.delete(sectionNameVal);
        if (hotKeyToDeactivate?.hotkeys.length && hotKeyToDeactivate.activeOnPages?.length) {
            registerHotkeys(sectionNameVal, hotKeyToDeactivate.hotkeys, hotKeyToDeactivate.activeOnPages, false)
        }
    };

    const setHotkeysActions = (sectionNameOverride?: ShortcutSectionName, actionsOverride?: Partial<Record<HotKeyOptions, HotkeyUpdates>>) => {
        const sectionNameVal: ShortcutSectionName | undefined = sectionNameOverride || sectionName;
        if (!sectionNameVal) return;
        const actionsVal = actionsOverride || actions;
        if (!actionsVal) return;

        const section = hotkeyRegistry.value.get(sectionNameVal);
        if (!section) return;

        const updatedHotkeys = section.hotkeys.map(hotkey => ({
            ...hotkey,
            action: actionsVal[hotkey.key]?.action || hotkey.action,
            condition: actionsVal[hotkey.key]?.condition || hotkey.condition
        }));
        
        hotkeyRegistry.value.set(sectionNameVal, {
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

            // If the user pressed Shift+?, permanently dismiss the hotkey hint
            if (hotkey.key === '?' && event.shiftKey) {
                markHotkeyHintDismissed();
            }

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
        setHotkeysActions();
    });

    onUnmounted(() => {
        window.removeEventListener('keydown', handleKeyPressHelper);
        unregisterHotkeys();
    });
    
    return {
        registerHotkeys,
        unregisterHotkeys,
        setHotkeysActions,
        hotkeyList,
        notifyHotkeyAvailable,
        showHotkeyHint,
        dismissHotkeyHint,
        initHotkeyHintFromProfile,
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
    {
        name: ShortcutSectionName.FAMILY_TREE_DETAILS,
        active: false,
        activeOnPages: [{ name: 'Family Tree View', url: '/:familyName/:familyId'}],
        hotkeys: [
            {
                key: 'f',
                modifier: 'shift',
                description: 'Show/Hide Family Details',
                action: () => {}
            }
        ]
    },
    {
        name: ShortcutSectionName.FAMILY_TREE_PERSON_DETAILS,
        active: false,
        activeOnPages: [{ name: 'Family Tree View', url: '/:familyName/:familyId'}],
        hotkeys: [
            {
                key: 'p',
                modifier: 'shift',
                description: 'Show/Hide A Person\'s Details',
                action: () => {}
            }
        ]
    },
];