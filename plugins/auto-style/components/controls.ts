import { autoStyleStore } from "../store/autoStyleStore";
import type { StyleUpdateResponse } from "../types";
import { saveHistory } from "../utils/storage";
import { toggleStyleMode } from "../utils/style-menu"

export const createControlsPanel = () => {
    const panel = document.createElement('div')
    panel.id = 'auto-style-controls'
    panel.className = 'fixed bottom-4 right-4 z-50 flex flex-col gap-2'

    // Exit button
    const exitButton = document.createElement('button')
    exitButton.innerHTML = '✕'
    exitButton.id = 'auto-style-exit'
    exitButton.className = 'p-3 bg-red-500 hover:bg-red-600 text-white rounded-md shadow-lg transition-colors duration-300 ease-in-out'
    exitButton.onclick = toggleStyleMode;

    // Undo button
    const undoButton = document.createElement('button')
    undoButton.innerHTML = '↩️'
    undoButton.className = 'p-3 bg-black dark:bg-white dark:text-black text-white rounded-md shadow-lg transition-colors duration-300 ease-in-out hover:bg-slate-800 dark:hover:bg-slate-200'
    undoButton.onclick = async () => {
        if (autoStyleStore.getStyleHistory().length > 0) {
            await undoAllChanges()
        }
    }

    panel.appendChild(undoButton)
    panel.appendChild(exitButton)
    document.body.appendChild(panel)
}

export const createToggleButton = () => {
    const button = document.createElement('button')
    button.innerHTML = '🎨'

    const updateButtonClass = () => {
        button.className = `fixed bottom-4 right-4 z-50 p-3 bg-black dark:bg-white hover:bg-black/60 dark:hover:bg-white/60 dark:text-black text-white rounded-md shadow-lg transition-colors duration-300 ease-in-out`
    }

    // Set initial class
    updateButtonClass()

    // Update button class when state changes
    button.onclick = () => {
        toggleStyleMode()
        updateButtonClass()
    }

    document.body.appendChild(button)
}

export const undoAllChanges = async () => {
    const changes = [...autoStyleStore.getStyleHistory()].reverse();

    for (const change of changes) {
        try {
            // Only remove styles that start with the same category as the ones we added
            const [category] = change.newStyle.split('-');

            const response = await $fetch<StyleUpdateResponse>('/api/update-component-style', {
                method: 'POST',
                body: JSON.stringify({
                    filePath: change.filePath,
                    elementId: change.elementId,
                    elementPath: change.elementPath,
                    newStyle: change.oldStyle || '', // If there was no previous style, just remove the new one
                    currentClasses: change.newStyle,
                    isUndo: true,
                    category // Add category to help identify which type of style to remove
                })
            });

            if (response.success) {
                // Update the element in the DOM if it still exists
                const element = document.querySelector(`[data-style-id="${change.elementId}"]`);
                if (element instanceof HTMLElement) {
                    const currentClasses = element.className.split(' ');
                    // Only filter out classes that start with the same category
                    const filteredClasses = currentClasses.filter(cls => !cls.startsWith(category));
                    // Only add back the old style if it exists
                    const newClasses = change.oldStyle
                        ? [...filteredClasses, change.oldStyle]
                        : filteredClasses;
                    element.className = newClasses.join(' ');
                }
            }
        } catch (error) {
            console.error('Error undoing change:', error);
        }
    }

    // Clear the history after undoing all changes
    autoStyleStore.setStyleHistory([]);
    saveHistory([]); // Clear localStorage
};