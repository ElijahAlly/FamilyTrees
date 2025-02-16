// * Settings dropdown for style menu

import { autoStyleStore } from "../store/autoStyleStore";
import { closeCurrentDropdown } from "../utils/dom-utils";

export const createSettingsDropdown = (updateBlurBg: () => void) => {
    const section = document.createElement('div');
    section.className = 'border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden';

    const header = document.createElement('button');
    header.className = 'w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors';
    header.innerHTML = `
                <span class="text-sm font-medium flex items-center gap-2 dark:text-white">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    Auto Style Settings
                </span>
                <svg class="w-4 h-4 transform transition-transform duration-200 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
            `;

    const content = document.createElement('div');
    content.className = 'hidden';

    content.innerHTML = `
                <div class="p-3 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                    <div class="space-y-4">
                        <div class="border-b border-gray-200 dark:border-gray-700 pb-4">
                            <div class="text-xs font-medium mb-3">Blur Amount</div>
                            <div class="flex items-center justify-between px-1">
                                <button class="decrease-blur text-sm text-violet-300 hover:text-violet-500 transition-colors border rounded-md p-2">
                                    -
                                </button>
                                <span class="text-xs text-violet-500">Level ${autoStyleStore.getMenuBlurLevel()}</span>
                                <button class="increase-blur text-sm text-violet-300 hover:text-violet-500 transition-colors border rounded-md p-2">
                                    +
                                </button>
                            </div>
                        </div>
                        <!-- More settings can be added here -->
                    </div>
                </div>
            `;

    let isOpen = false;
    header.onclick = () => {
        if (isOpen) {
            content.className = 'hidden';
            header.querySelector('svg:last-child')?.classList.remove('rotate-180');
            autoStyleStore.setCurrentOpenDropdown(null);
        } else {
            closeCurrentDropdown();
            content.className = 'block';
            header.querySelector('svg:last-child')?.classList.add('rotate-180');
            autoStyleStore.setCurrentOpenDropdown(section);
        }
        isOpen = !isOpen;
    };

    content.querySelector('.decrease-blur')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (autoStyleStore.getMenuBlurLevel() > 0) {
            autoStyleStore.setMenuBlurLevel(autoStyleStore.getMenuBlurLevel() - 1);
            updateBlurBg();
            content.querySelector('span.text-violet-500')!.textContent = `Level ${autoStyleStore.getMenuBlurLevel()}`;
        }
    });

    content.querySelector('.increase-blur')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (autoStyleStore.getMenuBlurLevel() < 6) {
            autoStyleStore.setMenuBlurLevel(autoStyleStore.getMenuBlurLevel() + 1);
            updateBlurBg();
            content.querySelector('span.text-violet-500')!.textContent = `Level ${autoStyleStore.getMenuBlurLevel()}`;
        }
    });

    section.appendChild(header);
    section.appendChild(content);

    return section;
};