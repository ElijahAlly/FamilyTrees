// * Text colors dropdown

import { STYLE_OPTIONS } from "../utils/style-generators";
import { autoStyleStore } from "../store/autoStyleStore";
import { closeCurrentDropdown } from "../utils/dom-utils";

export const createTextColorDropdown = () => {
    const section = document.createElement('div');
    section.className = 'border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden';

    const header = document.createElement('button');
    header.className = 'w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors';
    header.innerHTML = `
        <span class="text-sm font-medium dark:text-white">Text Colors</span>
        <svg class="w-4 h-4 transform transition-transform duration-200 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
        </svg>
    `;

    const content = document.createElement('div');
    content.className = 'hidden';

    content.innerHTML = `
        <div class="p-3 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
            <div class="space-y-4">
                ${STYLE_OPTIONS.text.map((colorGroup, index) => {
                    const colorName = colorGroup[0].name.split('-')[0];
                    return `
                        ${index !== 0 ? '<hr class="border-gray-200 dark:border-gray-700 my-3">' : ''}
                        <div>
                            <div class="text-black dark:text-white text-xs font-medium mb-2 capitalize">${colorName}</div>
                            <div class="grid grid-cols-6 gap-2">
                                ${colorGroup.map(option => `
                                    <button 
                                        class="w-6 h-6 rounded-full hover:ring-2 hover:ring-offset-2 transition-all bg-white dark:bg-zinc-800 ${option.class}"
                                        data-style="${option.class}"
                                        title="${option.name}"
                                    >
                                        A
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;

    let isOpen = false;
    header.onclick = () => {
        if (isOpen) {
            // Just close this dropdown
            content.className = 'hidden';
            header.querySelector('svg')?.classList.remove('rotate-180');
            autoStyleStore.setCurrentOpenDropdown(null);
        } else {
            // Close any other open dropdown first
            closeCurrentDropdown();

            // Then open this one
            content.className = 'block';
            header.querySelector('svg')?.classList.add('rotate-180');
            autoStyleStore.setCurrentOpenDropdown(section);
        }
        isOpen = !isOpen;
    };

    content.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const style = button.getAttribute('data-style');
            if (style) {
                window.autoStyle.updateStyle(style);
                const menu = document.querySelector('[data-style-menu]');
                if (menu) {
                    menu.remove();
                    autoStyleStore.setStyleMenuVisible(false);
                }
            }
        });
    });

    section.appendChild(header);
    section.appendChild(content);

    return section;
};