import { defineNuxtPlugin } from 'nuxt/app';
import { type DirectiveBinding, type VNode } from 'vue';
import { createToggleButton } from './components/controls';
import { updateStyle } from './utils/update-styles';

export default defineNuxtPlugin((nuxtApp) => {
    // Only run in development mode
    if (process.env.NODE_ENV !== 'development') {
        console.log('Skipping auto-styles generation in production');
        process.exit(0);
    }
    
    // Register the directive for both client and server
    nuxtApp.vueApp.directive('auto-style', {
        getSSRProps() {
            // Return empty props for SSR
            return {}
        },
        mounted(el: HTMLElement, binding: DirectiveBinding, vnode: VNode) {
            if (import.meta.client) {
                const uniqueId = Math.random().toString(36).slice(2, 11);
                el.setAttribute('data-style-id', `style-${uniqueId}`);

                // Get the component name from the directive argument
                const componentName = binding.arg;
                if (componentName) {
                    // console.log('Setting component name:', componentName);
                    el.setAttribute('data-v-component', componentName);
                }
            }
        },
        unmounted(el: HTMLElement) {
            if (import.meta.client) {
                el.removeAttribute('data-style-id')
                el.removeAttribute('data-v-component')
            }
        }
    })

    // Only execute client-side code
    if (import.meta.client) {

        // Initialize client-side features
        createToggleButton();

        // Expose methods globally
        window.autoStyle = { updateStyle };

        // Add watch for auto-applying styles after refresh
        // watch(() => autoStyleStore.value.styleHistory, (history) => {
        //     // Re-apply styles to elements that exist in the DOM
        //     history.forEach(change => {
        //         const element = document.querySelector(`[data-style-id="${change.elementId}"]`);
        //         if (element instanceof HTMLElement) {
        //             const currentClasses = element.className.split(' ');
        //             const [category] = change.newStyle.split('-');
        //             const filteredClasses = currentClasses.filter(cls => !cls.startsWith(category));
        //             const newClasses = [...filteredClasses, change.newStyle];
        //             element.className = newClasses.join(' ');
        //         }
        //     });
        // }, { immediate: true });
    }
})
