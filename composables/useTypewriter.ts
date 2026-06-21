import { ref } from 'vue'

/**
 *
 * @param text Text to display when typing
 * @param speed Lower number (in ms) will type the next character faster
 * @param delay How long should it wait before starting to type the text (This is NOT the pause between characters, use speed)
 */
export function useTypewriter(text: string, speed: number = 100, delay: number = 0) {
    const displayText = ref('');
    const isTyping = ref(false);
    const isDeleting = ref(false);

    let cancelled = false;

    const typeText = async (textToType: string = text) => {
        cancelled = false;
        isTyping.value = true;

        if (delay) {
            await new Promise(resolve => setTimeout(resolve, delay));
            if (cancelled) return;
        }

        for (let i = 0; i <= textToType.length; i++) {
            if (cancelled) return;
            displayText.value = textToType.slice(0, i);
            await new Promise(resolve => setTimeout(resolve, speed));
        }

        if (!cancelled) {
            isTyping.value = false;
        }
    }

    const deleteText = async (textToDelete: string = displayText.value, newText?: string) => {
        cancelled = false;
        isDeleting.value = true;

        if (delay) {
            await new Promise(resolve => setTimeout(resolve, delay));
            if (cancelled) return;
        }

        for (let i = textToDelete.length - 1; i >= 0; i--) {
            if (cancelled) return;
            displayText.value = textToDelete.slice(0, i);
            await new Promise(resolve => setTimeout(resolve, speed));
        }

        if (!cancelled) {
            isDeleting.value = false;
            if (newText) {
                await typeText(newText);
            }
        }
    }

    const reset = () => {
        cancelled = true;
        displayText.value = '';
        isTyping.value = false;
        isDeleting.value = false;
    }

    return {
        displayText,
        isTyping,
        isDeleting,
        typeText,
        deleteText,
        reset
    }
}
