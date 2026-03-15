<script setup lang="ts">
import { watch, onMounted } from 'vue';
import { Icon } from '@iconify/vue';

const props = withDefaults(defineProps<{
    message: string;
    visible: boolean;
    duration?: number;
    type?: 'info' | 'warning' | 'success';
    dismissible?: boolean;
    actionLabel?: string;
    actionFn?: () => void;
}>(), {
    duration: 5000,
    type: 'info',
    dismissible: true,
});

const emit = defineEmits<{
    (e: 'close'): void;
}>();

const { isMobile } = useDevice();

let timer: ReturnType<typeof setTimeout> | null = null;

const startTimer = () => {
    if (timer) clearTimeout(timer);
    if (props.duration > 0) {
        timer = setTimeout(() => emit('close'), props.duration);
    }
};

watch(() => props.visible, (val) => {
    if (val) startTimer();
    else if (timer) clearTimeout(timer);
});

onMounted(() => {
    if (props.visible) startTimer();
});

const iconMap = {
    info: 'mdi:information-outline',
    warning: 'mdi:alert-outline',
    success: 'mdi:check-circle-outline',
};

const colorMap = {
    info: 'bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900',
    warning: 'bg-amber-600 dark:bg-amber-500 text-white dark:text-zinc-900',
    success: 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-zinc-900',
};
</script>

<template>
    <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="translate-y-4 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="translate-y-4 opacity-0"
    >
        <div
            v-if="visible"
            :class="[
                'fixed left-1/2 -translate-x-1/2 z-[100] gap-2 px-4 py-3 rounded-lg shadow-lg max-w-md text-sm font-medium',
                isMobile ? 'flex-col justify-center items-center bottom-16' : 'flex items-center bottom-6',
                colorMap[type],
            ]"
        >

            <Icon v-if="!isMobile" :icon="iconMap[type]" class="w-5 h-5 shrink-0" />
            <span><Icon v-if="isMobile" :icon="iconMap[type]" class="w-5 h-5 inline-block" /> {{ message }}</span>
            <button
                v-if="actionLabel && actionFn"
                @click="actionFn"
                class="ml-2 underline font-semibold whitespace-nowrap hover:opacity-80"
            >
                {{ actionLabel }}
            </button>
            <button
                v-if="dismissible"
                @click="emit('close')"
                class="ml-2 hover:opacity-70 shrink-0"
            >
                <Icon icon="mdi:close" class="w-4 h-4" />
            </button>
        </div>
    </Transition>
</template>
