import { showStyleMenu } from "../components";
import { createControlsPanel } from "../components/controls";
import { autoStyleStore } from "../store/autoStyleStore";
import { findRealComponentName, getElementPath } from "./dom-utils";
import { handleClick, handleMouseOut, handleMouseOver } from "./event-handlers";

export const handleContextMenu = (e: Event) => {
    if (!autoStyleStore.getIsActive()) return;
    e.preventDefault();

    const target = e.target as HTMLElement;

    // Find the wrapper component
    const componentWrapper = target.closest('[data-v-component]');
    if (!componentWrapper) {
        console.warn('No component wrapper found');
        return;
    }

    // Try to get the real component name
    const realComponentName = findRealComponentName(target);
    // console.log('Real component name:', realComponentName);

    // Allow styling the clicked element if it's within the wrapper
    const elementToStyle = target;

    if (elementToStyle) {
        // Generate a unique style ID if it doesn't exist
        if (!elementToStyle.hasAttribute('data-style-id')) {
            const uniqueId = Math.random().toString(36).slice(2, 11);
            elementToStyle.setAttribute('data-style-id', `style-${uniqueId}`);
        }

        // Store exact path to this element for precise updates
        const elementPath = getElementPath(elementToStyle);
        elementToStyle.setAttribute('data-element-path', elementPath);

        // Add component reference using the real component name if found
        if (realComponentName) {
            elementToStyle.setAttribute('data-v-component', realComponentName);
        }


        showStyleMenu(e as MouseEvent);
        return elementToStyle;
    }
};

export const toggleStyleMode = () => {
    // First disable everything if it was active
    if (autoStyleStore.getIsActive()) {
        disableStyleMode();
    }

    autoStyleStore.setActive(!autoStyleStore.getIsActive());

    // Toggle visibility of buttons
    const toggleButton = document.getElementById('auto-style-toggle')
    const controlsPanel = document.getElementById('auto-style-controls')

    if (autoStyleStore.getIsActive()) {
        if (toggleButton) toggleButton.style.display = 'none'
        createControlsPanel()
        enableStyleMode()
    } else {
        if (toggleButton) toggleButton.style.display = 'block'
        if (controlsPanel) controlsPanel.remove()
    }
}

export const enableStyleMode = () => {
    const document = window.document.getElementsByTagName('body')[0];
    if (document) {
        document.style.userSelect = 'none';

        // After a short delay, show taost when user left-clicks while auto-style mode is active.
        setTimeout(() => {
            document.onclick = () => {
                if (autoStyleStore.getIsActive() && !autoStyleStore.getShowingWarningToast() && !autoStyleStore.getStyleMenuVisible()) {
                    showToast(['Auto-Style editing mode is active.', 'Right-click or Ctrl+Click to select an element to style.']);
                }
            }
        }, 30)
    } else {
        window.confirm('Unable to find element with tag name `body`. This needs to be present for the auto-style plugin to work.');
        return;
    }

    // Find all elements within components that have data-v-component
    const componentWrappers = document.querySelectorAll('[data-v-component]');

    componentWrappers.forEach((wrapper) => {
        // Add hover effect to the wrapper and all its children
        const elements = [wrapper, ...Array.from(wrapper.getElementsByTagName('*'))];

        elements.forEach((el) => {
            if (el instanceof HTMLElement) {
                // Store original styles
                autoStyleStore.setOriginalStyles(el, el.className);

                // Add hover effect
                el.style.cursor = 'pointer';
                el.addEventListener('mouseover', (el) => handleMouseOver(el));
                el.addEventListener('mouseout', (el) => handleMouseOut(el));
                el.addEventListener('click', (el) => {
                    const target = handleClick(el);
                    console.log("\n== target in enableStyleMode ==\n", target, "\n");
                    if (target) autoStyleStore.setSelectedElement(target);
                });
                el.addEventListener('contextmenu', handleContextMenu);
            }
        });
    });
}

export const disableStyleMode = () => {
    // Reset the style menu visibility
    autoStyleStore.setStyleMenuVisible(false);

    // Remove body click handler
    const document = window.document.getElementsByTagName('body')[0];
    if (document) {
        document.style.userSelect = '';
        document.onclick = null;
    }

    // Find all elements within components that have data-v-component
    const componentWrappers = document.querySelectorAll('[data-v-component]');

    componentWrappers.forEach((wrapper) => {
        const elements = [wrapper, ...Array.from(wrapper.getElementsByTagName('*'))];

        elements.forEach((el) => {
            if (el instanceof HTMLElement) {
                el.style.cursor = '';
                el.style.outline = '';
                el.removeEventListener('mouseover', (el) => handleMouseOver(el));
                el.removeEventListener('mouseout', (el) => handleMouseOut(el));
                el.removeEventListener('click', (el) => {
                    const target = handleClick(el);
                    console.log("\n== target in disableStyleMode 1 ==\n", target, "\n");
                    if (target) autoStyleStore.setSelectedElement(target);
                });
                el.removeEventListener('contextmenu', (el) => {
                    const target = handleContextMenu(el);
                    console.log("\n== target in disableStyleMode 2 ==\n", target, "\n");
                    if (target) autoStyleStore.setSelectedElement(target);
                });
            }
        });
    });

    // Remove any existing style menu
    const existingMenu = document.querySelector('[data-style-menu]');
    if (existingMenu) {
        existingMenu.remove();
    }
}


export const showToast = (messages: string[], timeout: number = 6000) => {
    autoStyleStore.setShowingWarningToast(true);

    setTimeout(() => {
        autoStyleStore.setShowingWarningToast(false);
    }, timeout + 300);

    let toastContainer = document.getElementById('auto-style-toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'auto-style-toast-container';
        toastContainer.className = 'fixed bottom-4 left-4 z-50 w-auto';
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = `
        w-auto
        bg-black/90 dark:bg-white/90 
        text-white dark:text-black 
        px-4 py-3 
        rounded-lg 
        shadow-lg 
        max-w-md 
        opacity-0 
        translate-y-full
        transition-all 
        duration-500 
        ease-in-out
        relative
        flex
        items-start
        gap-2
    `;

    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'flex-1';

    messages.forEach(message => {
        const messageEle = document.createElement('p');
        messageEle.className = 'whitespace-nowrap';
        messageEle.textContent = message;
        contentWrapper.appendChild(messageEle);
    });

    const closeButton = document.createElement('button');
    closeButton.innerHTML = '✕';
    closeButton.className = `
        border 
        rounded-md
        p-4
        text-md
        text-white
        dark:text-black
        hover:bg-violet-800
        dark:hover:bg-white/20 
        w-5 
        h-5 
        flex 
        items-center 
        justify-center 
        transition-colors
        duration-200
        shrink-0
    `;

    const closeToast = (e?: Event) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        // Add closing classes
        toast.classList.add('opacity-0', 'translate-y-full');

        // Remove the element after animation
        setTimeout(() => {
            toast.remove();
            if (toastContainer?.children.length === 0) {
                toastContainer.remove();
            }
        }, 500);
    };

    // Add event listener
    closeButton.onclick = closeToast;

    // close toast if auto-styles is exited
    const closeAutoStyleButton = document.getElementById('auto-style-exit');
    if (closeAutoStyleButton) {
        closeAutoStyleButton.onclick = () => {
            closeToast();
            toggleStyleMode();
        }
    }

    toast.appendChild(contentWrapper);
    toast.appendChild(closeButton);
    toastContainer.appendChild(toast);

    toastContainer.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
    }

    // Trigger show animation
    requestAnimationFrame(() => {
        toast.classList.remove('opacity-0', 'translate-y-full');
    });

    // Set auto-close timeout
    const timeoutId = setTimeout(() => closeToast(), timeout);

    // Clear timeout on manual close
    closeButton.addEventListener('click', () => {
        clearTimeout(timeoutId);
    }, { once: true });
};