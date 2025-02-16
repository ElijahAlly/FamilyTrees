// * Background colors dropdown

import { closeCurrentDropdown } from "../utils/dom-utils";
import { STYLE_OPTIONS } from "../utils/style-generators";
import { autoStyleStore } from "../store/autoStyleStore";

export const createBackgroundColorDropdown = () => {
    // Create collapsible section
    const section = document.createElement('div');
    section.className = 'border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden';

    // Create header button
    const header = document.createElement('button');
    header.className = 'w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors';
    header.innerHTML = `
        <span class="text-sm font-medium mr-4 dark:text-white">Background Colors</span>
        <svg class="w-4 h-4 transform transition-transform duration-200 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
        </svg>
    `;

    // Create content container with max height and scrolling
    const content = document.createElement('div');
    content.className = 'hidden';

    // Create scrollable container for colors
    content.innerHTML = `
        <div class="p-3 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
            <div class="space-y-4">
                ${STYLE_OPTIONS.backgrounds.map((colorGroup, index) => {
                    // Get the color name from the first item in the group
                    const colorName = colorGroup[0].name.split('-')[0];
                    return `
                        <div>
                            ${index !== 0 ? '<hr class="border-gray-200 dark:border-gray-700 my-3">' : ''}
                            <div>
                            <div class="text-black dark:text-white text-xs font-medium mb-2 capitalize">${colorName}</div>
                            <div class="grid grid-cols-6 gap-2">
                                ${colorGroup.map(option => `
                                    <button 
                                        class="${option.class} w-6 h-6 rounded-full hover:ring-2 hover:ring-offset-2 transition-all"
                                        data-style="${option.class}"
                                        title="${option.name}"
                                    >
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;

    // Toggle functionality
    let isOpen = false;
    header.onclick = () => {
        if (isOpen) {
            // close this dropdown
            content.className = 'hidden';
            header.querySelector('svg')?.classList.remove('rotate-180');
            autoStyleStore.setCurrentOpenDropdown(null);
        } else {
            // close all other dropdowns and open this dropdown
            closeCurrentDropdown();

            // Then open this one
            content.className = 'block';
            header.querySelector('svg')?.classList.add('rotate-180');
            autoStyleStore.setCurrentOpenDropdown(section);
        }
        isOpen = !isOpen;
    };

    // Add click handlers to color buttons
    content.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const style = button.getAttribute('data-style');
            if (style) {
                window.autoStyle.updateStyle(style);
                // Find and remove the menu
                const menu = document.querySelector('[data-style-menu]');
                if (menu) {
                    menu.remove();
                    autoStyleStore.setStyleMenuVisible(false);
                }
            }
        });
    });

    // Assemble the section
    section.appendChild(header);
    section.appendChild(content);

    return section;
};