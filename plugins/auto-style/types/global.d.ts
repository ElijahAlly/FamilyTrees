export {};

declare global {
    interface Window {
        autoStyle: {
            updateStyle: (newStyle: string) => void
        }
    }
}