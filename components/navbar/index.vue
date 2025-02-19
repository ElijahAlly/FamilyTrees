<script setup lang="ts">
import NavigationMenu from './NavigationMenu.vue';
import ThemeToggler from '../ui/ThemeToggler.vue';
</script>

<template>
    <nav
        class="sticky top-0 left-0 w-full flex items-center min-h-[8vh] max-h-[8vh] p-4 bg-gradient-to-b from-zinc-300 to-neutral-50 dark:from-zinc-900 dark:to-neutral-950 z-50 border-b border-zinc-200 dark:border-zinc-700"
    >
        <div class="flex items-center rounded-md p-3 w-full">
            <NuxtLink to="/">
                <!-- <NuxtImg src="/my-trees-logo-with-name.png" class="cursor-pointer rounded-md hover:shadow-md" height="99" /> -->
                <h2 class="text-3xl font-extralight text-zinc-950 dark:text-zinc-200">FamilyTrees</h2>
            </NuxtLink>
            <NavigationMenu />
            <ThemeToggler />
        </div>
    </nav>
</template>