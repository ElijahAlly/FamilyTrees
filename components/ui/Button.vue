<script setup lang="ts">
import { computed, type PropType } from 'vue';

type Variant = 'default' | 'destructive' | 'outline' | 'ghost' | 'transparent' | 'submit' | 'active';
type Size = 'default' | 'fit' | 'sm' | 'lg' | 'icon';

const props = defineProps({
    variant: { type: String as PropType<Variant>, default: 'default', required: false },
    size: { type: String as PropType<Size>, default: 'default', required: false },
    active: { type: Boolean, default: false, required: false },
    disabled: { type: Boolean, default: false, required: false },
    ring: { type: Boolean, default: false, required: false },
    class: { type: String, default: '', required: false },
});

const emit = defineEmits<{
    (e: 'click', event: MouseEvent): void
}>();

const variants = {
    default: `bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-2 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600`,
    destructive: `bg-red-600 text-white border-2 border-red-600 hover:bg-red-700 hover:border-red-700`,
    outline: `bg-transparent border-2 border-zinc-300 dark:border-zinc-50 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800`,
    ghost: `bg-transparent text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800`,
    transparent: `bg-transparent border-transparent text-zinc-900 dark:text-zinc-100 hover:text-zinc-600 dark:hover:text-zinc-400`,
    submit: `bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-2 border-transparent hover:bg-zinc-800 dark:hover:bg-zinc-200 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]`,
    active: `bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border-2 border-zinc-300 dark:border-zinc-600`
};

const sizes = {
    default: 'h-10 w-10',
    fit: 'h-auto w-auto inline-flex',
    sm: 'h-9 w-9',
    lg: 'h-11 w-11',
    icon: 'h-10 w-10'
};

const padding = {
    default: 'px-4 py-2',
    fit: 'min-w-fit px-4 py-2',
    sm: 'px-3',
    lg: 'px-8',
    icon: 'p-2'
};

const buttonClasses = computed(() => {
    return [
        // Base classes
        'inline-flex items-center justify-center rounded-md text-sm font-medium',
        'transition-colors duration-200 ease-in-out',
        'focus:outline-none',
        'cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
        
        // Ring on focus classes
        props.ring ? 'focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400 focus:ring-offset-2' : 'focus:ring-none',

        // Variant classes
        variants[props.variant],
        
        // Size and padding classes
        sizes[props.size],
        padding[props.size],
        
        // Active state
        props.active && 'bg-zinc-200 dark:bg-zinc-700',
        
        // Custom classes
        props.class
    ].filter(Boolean).join(' ');
});
</script>

<template>
    <button
        :class="buttonClasses"
        :disabled="disabled"
        @click="(event) => emit('click', event)"
    >
        <slot></slot>
    </button>
</template>