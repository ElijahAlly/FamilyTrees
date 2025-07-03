<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { ref, computed, onMounted, onUnmounted } from 'vue';

const props = defineProps({
    isOpen: { type: Boolean, default: false},
    disableNavbar: { type: Boolean, default: false, required: false },
    width: { type: String, default: 'max-w-4xl', required: false },
});

const emit = defineEmits<{
    'update:isOpen': [value: boolean];
}>();

const showHideNavbarStyles = computed(() => {
    return { 'top-0': props.disableNavbar, 'top-[8vh]': !props.disableNavbar };
})

const modalRef = ref<HTMLElement | null>(null);

const closeModal = () => {
    emit('update:isOpen', false);
};

const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
        closeModal();
    }
};

onMounted(() => {
    document.addEventListener('keydown', handleEscape);
    if (props.disableNavbar) {
        const navbar = document.querySelector('nav');
        if (navbar) {
            navbar.style.pointerEvents = 'none';
            navbar.style.opacity = '0.5';
        }
    }
});

onUnmounted(() => {
    document.removeEventListener('keydown', handleEscape);
    if (props.disableNavbar) {
        const navbar = document.querySelector('nav');
        if (navbar) {
            navbar.style.pointerEvents = 'auto';
            navbar.style.opacity = '1';
        }
    }
});
</script>

<template>
    <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0"
        enter-to-class="opacity-100" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100"
        leave-to-class="opacity-0">
        <div v-if="isOpen" :class="['fixed inset-0 z-50 flex items-center justify-center overflow-y-auto', showHideNavbarStyles]">
            <!-- Backdrop -->
            <div :class="['fixed inset-0 bg-zinc-950/30 backdrop-blur-sm dark:bg-zinc-950/50', showHideNavbarStyles]" @click="closeModal"></div>

            <!-- Modal -->
            <div ref="modalRef" :class="['relative bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full p-6 overflow-hidden dark:border dark:border-zinc-500/50', width]" @click.stop>
                <button
                    class="absolute top-4 right-4 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                    @click="closeModal">
                    <Icon icon="heroicons:x-mark-20-solid" class="w-6 h-6" />
                </button>
                
                <slot></slot>
            </div>
        </div>
    </Transition>
</template>