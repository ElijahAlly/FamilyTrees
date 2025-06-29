import scrollbar from 'tailwind-scrollbar'

export default {
    darkMode: ['class', '.dark-mode'],
    content: [
        './components/**/*.{js,vue,ts}',
        './layouts/**/*.vue',
        './pages/**/*.vue',
        './plugins/**/*.{js,ts}',
        './app.vue',
        './assets/**/*.css',
        './error.vue'
    ],
    safelist: [
        'hover:shadow-gray-300',
        'hover:shadow-neutral-600',
        // Add any other dynamic shadow classes you might use
    ],
    theme: {
        extend: {},
    },
    plugins: [
        scrollbar({ nocompatible: true })
    ]
    // variants: {
    //     scrollbar: ['rounded', 'dark']
    // }
}