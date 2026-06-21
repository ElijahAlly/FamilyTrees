<script setup lang="ts">
import { useToast } from '@/composables/useToast';

const { toasts, dismissToast } = useToast();

const typeStyles: Record<string, string> = {
    success: 'bg-emerald-600 text-white',
    error: 'bg-red-600 text-white',
    warning: 'bg-amber-500 text-white',
    info: 'bg-zinc-800 text-white',
};
</script>

<template>
    <Teleport to="body">
        <div class="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
            <TransitionGroup
                enter-active-class="transition duration-300 ease-out"
                enter-from-class="transform translate-x-full opacity-0"
                enter-to-class="transform translate-x-0 opacity-100"
                leave-active-class="transition duration-200 ease-in"
                leave-from-class="transform translate-x-0 opacity-100"
                leave-to-class="transform translate-x-full opacity-0"
            >
                <div
                    v-for="toast in toasts"
                    :key="toast.id"
                    :class="[typeStyles[toast.type] || typeStyles.info]"
                    class="px-4 py-3 rounded-lg shadow-lg cursor-pointer text-sm font-medium"
                    @click="dismissToast(toast.id)"
                >
                    {{ toast.message }}
                </div>
            </TransitionGroup>
        </div>
    </Teleport>
</template>
