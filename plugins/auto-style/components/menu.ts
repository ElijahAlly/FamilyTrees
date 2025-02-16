// * Main style menu component

import { createBackgroundColorDropdown } from "./background";
import { createSettingsDropdown } from "./settings";
import { createTextColorDropdown } from "./text";
import { autoStyleStore } from "../store/autoStyleStore";
import { closeCurrentDropdown } from "../utils/dom-utils";

export const showStyleMenu = (e: MouseEvent) => {
    if (autoStyleStore.getStyleMenuVisible()) return;
    autoStyleStore.setStyleMenuVisible(true);

    const menu = document.createElement('div')
    menu.setAttribute('data-style-menu', 'true');
    menu.className = 'fixed z-50 w-80 h-96';

    // First append the menu to get its dimensions
    document.body.appendChild(menu);

    // Calculate available space
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const menuWidth = menu.offsetWidth;
    const menuHeight = menu.offsetHeight;

    // Calculate position to ensure menu stays in viewport
    let left = e.pageX;
    let top = e.pageY;

    // Adjust horizontal position if needed
    if (left + menuWidth > viewportWidth) {
        left = viewportWidth - menuWidth - 16; // 16px padding from viewport edge
    }

    // Adjust vertical position if needed
    if (top + menuHeight > viewportHeight) {
        top = viewportHeight - menuHeight - 16; // 16px padding from viewport edge
    }

    // Ensure minimum distance from edges
    left = Math.max(16, left);
    top = Math.max(16, top);

    // Apply calculated position
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
    
    // Create container with blur effect
    const container = document.createElement('div');
    container.className = 'relative rounded-lg shadow-xl p-4';

    // Create the blur background
    const blurBg = document.createElement('div');
    blurBg.className = 'absolute inset-0 rounded-lg -z-10';
    const updateBlurBg = () => {
        const blurClasses = [
            'bg-white/20 dark:bg-zinc-800/20',
            'bg-white/40 dark:bg-zinc-800/40 backdrop-blur-sm',
            'bg-white/50 dark:bg-zinc-800/50 backdrop-blur',
            'bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md',
            'bg-white/70 dark:bg-zinc-800/70 backdrop-blur-lg',
            'bg-white/80 dark:bg-zinc-800/80 backdrop-blur-xl',
            'bg-white/90 dark:bg-zinc-800/90 backdrop-blur-2xl',
        ];
        blurBg.className = `absolute inset-0 rounded-lg transition-all duration-200 -z-10 ${blurClasses[autoStyleStore.getMenuBlurLevel()]}`;
    };
    updateBlurBg();

    // Create content wrapper
    const wrapper = document.createElement('main');
    wrapper.className = 'space-y-4 relative z-10 overflow-y-auto max-h-80';

    // Add dropdowns
    wrapper.appendChild(createSettingsDropdown(updateBlurBg));
    wrapper.appendChild(createBackgroundColorDropdown());
    wrapper.appendChild(createTextColorDropdown());

    // Assemble the menu
    container.appendChild(blurBg);
    container.appendChild(wrapper);
    menu.appendChild(container);
    document.body.appendChild(menu);

    // Close menu when clicking outside
    const closeMenu = (e: MouseEvent) => {
        if (!menu.contains(e.target as Node)) {
            closeCurrentDropdown();
            menu.remove();
            autoStyleStore.setStyleMenuVisible(false);
            document.removeEventListener('click', closeMenu);
        }
    };
    document.addEventListener('click', closeMenu);
};