<script setup lang="ts">
import { Icon } from '@iconify/vue'

const { profile } = storeToRefs(useAuthStore());

const isHovering = ref(false);
</script>

<template>
    <NuxtLink v-if="profile" :to="{ name: 'member-personId-tree-create', params: { personId: profile.id } }">
        <span @mouseenter="isHovering = true" @mouseleave="isHovering = false"
            class="flex items-center justify-center w-fit bg-zinc-200 hover:text-white hover:bg-zinc-600 dark:text-white dark:hover:text-zinc-950 dark:bg-zinc-600 dark:hover:bg-zinc-300 rounded-md py-1 pl-2 select-none transition-all duration-500"
            :class="{ 'pr-2': !isHovering, 'pr-3': isHovering }">
            <p class="w-fit mr-2">Create New Family Tree</p>
            <Icon icon="grommet-icons:link-next" class="w-3 h-3 transition-transform duration-300 ease-in-out"
                :class="{ 'translate-x-1': isHovering }" />
        </span>
    </NuxtLink>
</template>