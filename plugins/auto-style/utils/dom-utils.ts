// * DOM manipulation utilities

import { autoStyleStore } from "../store/autoStyleStore";

export const getElementPath = (element: HTMLElement): string => {
    const path: string[] = [];
    let current = element;

    while (current && current.parentElement) {
        const parent = current.parentElement;
        const children = Array.from(parent.children);
        const index = children.indexOf(current);
        const tag = current.tagName.toLowerCase();
        const nth = `${tag}:nth-child(${index + 1})`;
        path.unshift(nth);
        current = parent;
    }

    return path.join(' > ');
};

export const findRealComponentName = (el: HTMLElement): string | null => {
    // Look for the nearest parent element with our <component_name>-as (auto-style) identifier
    const potentialRoot = el.closest('[class*="-as"]');
    if (!potentialRoot) return null;

    // Extract component name from the auto-style class
    const autoStyleClass = Array.from(potentialRoot.classList)
        .find(cls => cls.endsWith('-as'));

    if (autoStyleClass) {
        // Convert 'product-showcase-as' to 'ProductShowcase'
        return autoStyleClass
            .replace('-as', '')
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join('');
    }

    return null;
};

// ! NOT Working
// function isValidComponentName(name: string): name is ValidComponentName {
//     // Check if the name exists in the ValidComponentName type
//     const componentType: Record<ValidComponentName, boolean> = {} as Record<ValidComponentName, boolean>;
//     return name in componentType;
// }

// function isAutoStyleClass(className: string): className is AutoStyleClass {
//     // Check if the className exists in the AutoStyleClass type
//     const styleType: Record<AutoStyleClass, boolean> = {} as Record<AutoStyleClass, boolean>;
//     return className in styleType;
// }

export const getComponentPath = (el: HTMLElement): string | null => {
    // First try to get the component name from the data-v-component attribute
    // const componentName = el.getAttribute('data-v-component');

    // For debugging
    // console.log('Component name from attribute:', componentName);
    // console.log('Element classes:', el.className);

    // Find the root element with -as suffix
    const root = el.closest('[class*="-as"]');
    // console.log('Root element:', root);

    if (!root) {
        console.warn('No root element with -as suffix found');
        return null;
    }

    // Get all classes from the root element
    const rootClasses = Array.from(root.classList);
    // console.log('Root classes:', rootClasses);

    // Find the class that ends with -as
    const autoStyleClass = rootClasses.find(cls => cls.endsWith('-as'));
    // console.log('Auto style class:', autoStyleClass);

    if (!autoStyleClass) { //  || !isAutoStyleClass(autoStyleClass)
        console.warn('No auto-style class found');
        return null;
    }

    // Convert kebab case to pascal case
    const componentPath = autoStyleClass
        .replace('-as', '')
        .split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');

    // if (!isValidComponentName(componentPath)) {
    //     console.warn('Invalid component name:', componentPath);
    //     return null;
    // }

    // console.log('Component path:', componentPath);

    // Construct the file path
    return `components/${componentPath}.vue`;
};

export const closeCurrentDropdown = () => {
    if (autoStyleStore.getCurrentOpenDropdown()) {
        const content = autoStyleStore.getCurrentOpenDropdown()?.querySelector('div:not(.hidden)');
        const arrow = autoStyleStore.getCurrentOpenDropdown()?.querySelector('svg.rotate-180');
        if (content) content.className = 'hidden';
        if (arrow) arrow.classList.remove('rotate-180');
        autoStyleStore.setCurrentOpenDropdown(null);
    }
};