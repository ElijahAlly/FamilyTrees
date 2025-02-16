import type { Config } from 'tailwindcss'
import scrollbar from 'tailwind-scrollbar'

export default {
    darkMode: ['class', '.dark-mode'],
    content: [
        "./components/**/*.{js,vue,ts}",
        "./layouts/**/*.vue",
        "./pages/**/*.vue",
        "./plugins/**/*.{js,ts}",
        "./app.vue",
        "./assets/**/*.css",
    ],
    safelist: [
        'hover:shadow-gray-300',
        'hover:shadow-neutral-600',
        {
            // * auto-style
            pattern: /(bg|text)-.+-(50|100|200|300|400|500|600|700|800|900|950)/,
            variants: ['hover', 'dark', 'dark:hover'],
        }
    ],
    plugins: [
        scrollbar({ nocompatible: true })
    ],
    variants: {
        scrollbar: ['rounded', 'dark']
    }
} satisfies Config