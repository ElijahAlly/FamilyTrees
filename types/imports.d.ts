declare module '#imports' {
    export const useRuntimeConfig: typeof import('nuxt/app')['useRuntimeConfig']
    export { useColorMode } from '@nuxt/schema'
}
    