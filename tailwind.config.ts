module.exports = {
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
        // Add any other dynamic shadow classes you might use
    ],
    plugins: [
        require('tailwind-scrollbar')({ nocompatible: true })
    ],
    variants: {
        scrollbar: ['rounded', 'dark']
    }
}