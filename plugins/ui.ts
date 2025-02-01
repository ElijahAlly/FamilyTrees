import Button from '~/components/ui/Button.vue'

export default defineNuxtPlugin((nuxtApp: any) => {
    nuxtApp.vueApp.component('ui-button', Button)
})