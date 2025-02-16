import { ref } from 'vue';
import type { StyleState } from '../types';
import { loadHistory } from '../utils/storage';

const state = ref<StyleState>({
    isActive: false,
    selectedElement: null,
    originalStyles: new Map(),
    styleHistory: typeof window !== 'undefined' ? loadHistory() : [],
    styleMenuVisible: false,
    showingWarningToast: false,
    currentOpenDropdown: null,
    menuBlurLevel: 3
});

// Composable to access the state
function useAutoStyleStore() {
    // Getters
    const getIsActive = () => state.value.isActive;
    const getSelectedElement = () => state.value.selectedElement;
    const getStyleHistory = () => state.value.styleHistory;
    const getMenuBlurLevel = () => state.value.menuBlurLevel;
    const getStyleMenuVisible = () => state.value.styleMenuVisible;
    const getShowingWarningToast = () => state.value.showingWarningToast;
    const getCurrentOpenDropdown = () => state.value.currentOpenDropdown;
    const originalStyles = () => state.value.originalStyles;

    // Actions
    const setActive = (value: boolean) => state.value.isActive = value;
    const setSelectedElement = (element: HTMLElement | null) => state.value.selectedElement = element;
    const setSelectedElementClassNames = (classNames: string) => {
        if (state.value.selectedElement) state.value.selectedElement.className = classNames;
    }
    const setStyleHistory = (history: StyleState['styleHistory']) => state.value.styleHistory = history;
    const setMenuBlurLevel = (level: number) => state.value.menuBlurLevel = level;
    const setStyleMenuVisible = (visible: boolean) => state.value.styleMenuVisible = visible;
    const setShowingWarningToast = (showing: boolean) => state.value.showingWarningToast = showing;
    const setCurrentOpenDropdown = (dropdown: HTMLDivElement | null) => state.value.currentOpenDropdown = dropdown;
    const setOriginalStyles = (el: HTMLElement, styles: string) => state.value.originalStyles.set(el, styles);

    // Helper methods
    const toggleActive = () => state.value.isActive = !state.value.isActive;
    const addToStyleHistory = (change: StyleState['styleHistory'][0]) => {
        state.value.styleHistory = [...state.value.styleHistory, change];
    };
    const clearStyleHistory = () => state.value.styleHistory = [];

    return {
        // State
        // ...state,

        // Getters
        getIsActive,
        getSelectedElement,
        getStyleHistory,
        getMenuBlurLevel,
        getStyleMenuVisible,
        getShowingWarningToast,
        getCurrentOpenDropdown,
        originalStyles,

        // Actions
        setActive,
        setSelectedElement,
        setSelectedElementClassNames,
        setStyleHistory,
        setMenuBlurLevel,
        setStyleMenuVisible,
        setShowingWarningToast,
        setCurrentOpenDropdown,
        setOriginalStyles,

        // Helper methods
        toggleActive,
        addToStyleHistory,
        clearStyleHistory,
    };
}

export const autoStyleStore = useAutoStyleStore();

// Export a way to access raw state if needed (be careful with this)
// export { state as autoStyleState };