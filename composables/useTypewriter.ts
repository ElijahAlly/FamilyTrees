import { ref } from 'vue'

export function useTypewriter(text: string, speed: number = 100, delay: number = 0) {
    const displayText = ref('');
    const isTyping = ref(false);
    const isDeleting = ref(false);

    const typeText = async (textToType: string = text) => {
        isTyping.value = true;
        
        if (delay) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        for (let i = 0; i <= textToType.length; i++) {
            displayText.value = textToType.slice(0, i);
            await new Promise(resolve => setTimeout(resolve, speed));
        }
        
        isTyping.value = false;
    }

    const deleteText = async (textToDelete: string = displayText.value, newText?: string) => {
        isDeleting.value = true;
        
        if (delay) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        for (let i = textToDelete.length - 1; i >= 0; i--) {
            displayText.value = textToDelete.slice(0, i);
            await new Promise(resolve => setTimeout(resolve, speed));
        }
        
        isDeleting.value = false;
        if (newText) {
            await typeText(newText);
        }
    }

    const reset = () => {
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