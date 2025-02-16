
import { autoStyleStore } from '../store/autoStyleStore';
import type { StyleUpdateResponse } from '../types';
import { getComponentPath } from './dom-utils';
import { saveHistory } from './storage';
import { STYLE_OPTIONS } from './style-generators';

export const updateStyle = async (newStyle: string) => {
    console.log("\n== autoStyleStore.getSelectedElement() ==\n", autoStyleStore.getSelectedElement(), "\n");
    if (autoStyleStore.getSelectedElement()) {
        console.log('in updateStyle');
        const selectedElement = autoStyleStore.getSelectedElement();

        if (!selectedElement) {
            console.error('Missing required attributes:', { selectedElement });
            return;
        }

        const filePath = getComponentPath(selectedElement);
        const elementId = autoStyleStore.getSelectedElement()?.getAttribute('data-style-id');
        const elementPath = autoStyleStore.getSelectedElement()?.getAttribute('data-element-path');

        console.log("\n== filePath ==\n", filePath, "\n");
        console.log("\n== elementId ==\n", elementId, "\n");
        console.log("\n== elementPath ==\n", elementPath, "\n");

        // Add safety checks
        if (!filePath || !elementId || !elementPath) {
            console.error('Missing required attributes:', { filePath, elementId, elementPath });
            return;
        }

        // Get the current classes before modification
        const currentClasses = autoStyleStore.getSelectedElement()?.className.split(' ');
        const [category] = newStyle.split('-');

        console.log("\n== currentClasses ==\n", currentClasses, "\n");
        console.log("\n== category ==\n", category, "\n");

        // Validate the new style
        if (!currentClasses || !category || !STYLE_OPTIONS.backgrounds.flat().some(opt => opt.class === newStyle)) {
            console.error('Invalid style:', newStyle);
            return;
        }

        // Find the old style that matches the same category
        const oldStyle = currentClasses.find((cls: string) => cls.startsWith(category)) || '';

        console.log('Updating style with:', {
            filePath,
            elementId,
            elementPath,
            newStyle,
            oldStyle,
            elementCurrentClasses: autoStyleStore.getSelectedElement()?.className
        });

        try {
            // Update the element's class immediately for instant feedback
            const filteredClasses = currentClasses.filter((cls: string) => !cls.startsWith(category));
            const newClasses = [...filteredClasses, newStyle];
            autoStyleStore.setSelectedElementClassNames(newClasses.join(' '));

            const response = await $fetch<StyleUpdateResponse>('/api/update-component-style', {
                method: 'POST',
                body: JSON.stringify({
                    filePath,
                    elementId,
                    elementPath,
                    newStyle,
                    currentClasses: oldStyle // Send the old class for proper replacement
                })
            });

            console.log('Server response:', response);

            if (response.success) {
                // Add the change to history only after successful server update
                const newHistory = [...autoStyleStore.getStyleHistory(), {
                    elementId,
                    elementPath,
                    filePath,
                    oldStyle,
                    newStyle,
                    timestamp: Date.now()
                }];

                // Update state and save to localStorage
                autoStyleStore.setStyleHistory(newHistory)
                saveHistory(newHistory);
            } else {
                // Revert the change if the server update failed
                autoStyleStore.setSelectedElementClassNames(currentClasses.join(' '));
            }
        } catch (error) {
            console.error('Error updating component style:', error);
            // Revert the change on error
            autoStyleStore.setSelectedElementClassNames(currentClasses.join(' '));
        }
    }
}