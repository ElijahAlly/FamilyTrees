import { ref } from 'vue';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

const toasts = ref<Toast[]>([]);
let nextId = 0;

export function useToast() {
    const showToast = (message: string, type: ToastType = 'info', durationMs = 4000) => {
        const id = nextId++;
        toasts.value.push({ id, message, type });
        setTimeout(() => {
            toasts.value = toasts.value.filter(t => t.id !== id);
        }, durationMs);
    };

    const dismissToast = (id: number) => {
        toasts.value = toasts.value.filter(t => t.id !== id);
    };

    return { toasts, showToast, dismissToast };
}
