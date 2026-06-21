<script setup lang="ts">
import { Icon } from '@iconify/vue'
</script>

<template>
    <div class="flex items-center gap-2">
        <NuxtLink to="/discover"
            class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
        >
            <Icon icon="mdi:compass-outline" class="w-4 h-4" />
            Discover
        </NuxtLink>
    </div>
</template>
