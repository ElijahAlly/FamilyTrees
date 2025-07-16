<script setup lang="ts">
import { computed, type PropType } from 'vue';
const props = defineProps({
  text: { type: String, default: '', required: false },
  class: { type: String, default: '', required: false },
  type: { type: String as PropType<'div' | 'button' | 'a'>, default: 'div', required: false }
});

const classes = computed(() => `
    ${props.type === 'button' ? `
        cursor-pointer
    ` : ''}
    ${props.class}
`);
</script>

<template>
    <div v-if="text.length" :class="['w-fit h-fit p-3 m-3 hover:border-zinc-300 dark:hover:border-none hover:shadow-sm dark:hover:shadow-zinc-700 border rounded-md transition-all duration-300', classes]">
        <div>{{ text }}</div>
        <slot name="default"></slot>
    </div>
</template>