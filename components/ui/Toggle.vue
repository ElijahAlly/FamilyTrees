<script setup lang="ts">
import { type PropType } from 'vue';

const props = defineProps({
    modelValue: { type: Boolean, default: false, required: true },
    id: { type: String, default: '', required: false },
    size: { type: String as PropType<'sm' | 'md' | 'lg'>, default: 'md', required: false },
    label: { type: String, default: '', required: false },
    darkVariant: { type: Boolean, default: false, required: false }
});

const emit = defineEmits<{
    'update:modelValue': [value: boolean];
}>();

const sizes = {
    sm: {
        wrapper: 'h-5 w-9',
        toggle: 'after:h-4 after:w-4 after:left-[2px] after:top-[2px]'
    },
    md: {
        wrapper: 'h-6 w-11',
        toggle: 'after:h-5 after:w-5 after:left-[2px] after:top-[2px]'
    },
    lg: {
        wrapper: 'h-7 w-14',
        toggle: 'after:h-6 after:w-6 after:left-[3px] after:top-[2px]'
    }
};

const toggleId = props.id || `toggle-${Math.random().toString(36).slice(2)}`;
</script>

<template>
    <div class="group relative inline-flex items-center rounded-full border-2" :class="[
        darkVariant ? 'border-zinc-600/60 dark:border-white/60' : ''
    ]">
        <input :id="toggleId" type="checkbox" :checked="modelValue" @change="emit('update:modelValue', !modelValue)"
            class="peer sr-only" />
        <label :for="toggleId" :class="[
            sizes[size].wrapper,
            'relative cursor-pointer rounded-full transition-colors',
            darkVariant
                ? 'bg-zinc-500/50 dark:peer-checked:bg-zinc-300/50 peer-checked:bg-black'
                : 'bg-zinc-200 dark:bg-zinc-700 peer-checked:bg-zinc-500',
            'after:absolute after:rounded-full after:transition-all after:content-[\'\']',
            sizes[size].toggle,
            darkVariant
                ? 'after:bg-zinc-50 dark:after:bg-zinc-800'
                : 'after:bg-white dark:after:bg-zinc-200',
            'peer-checked:after:translate-x-full',
            'peer-focus:outline-none'
        ]">
            <span class="sr-only">{{ label || 'Toggle' }}</span>
        </label>
    </div>
</template>