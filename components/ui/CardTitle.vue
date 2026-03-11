<script setup lang="ts">
const props = defineProps<{
    title: string
}>();
</script>

<template>
    <div class="absolute -top-4 left-3 text-lg font-light dark:text-zinc-50/80 bg-zinc-50 dark:bg-zinc-950 px-2 z-20">
        {{ title }}
    </div>
</template>