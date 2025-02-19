import { ref } from 'vue'

export function useTypewriter(text: string, speed: number = 100, delay: number = 0) {
    const displayText = ref('');
    const isTyping = ref(false);

    const typeText = async () => {
        isTyping.value = true;
        
        if (delay) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        for (let i = 0; i <= text.length; i++) {
            displayText.value = text.slice(0, i);
            await new Promise(resolve => setTimeout(resolve, speed));
        }
        
        isTyping.value = false;
    }

    const reset = () => {
        displayText.value = '';
        isTyping.value = false;
    }

    return {
        displayText,
        isTyping,
        typeText,
        reset
    }
}