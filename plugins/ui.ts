import Button from '~/components/ui/Button.vue'
import {
    SliderRoot,
    SliderThumb,
    SliderTrack,
    SliderRange,
} from 'radix-vue'
import { defineNuxtPlugin } from 'nuxt/app';

export default defineNuxtPlugin((nuxtApp: any) => {
    nuxtApp.vueApp.component('ui-button', Button);

    nuxtApp.vueApp.component('ui-slider-root', SliderRoot)
    nuxtApp.vueApp.component('ui-slider-thumb', SliderThumb)
    nuxtApp.vueApp.component('ui-slider-track', SliderTrack)
    nuxtApp.vueApp.component('ui-slider-range', SliderRange)
})