<script setup lang="ts">
import { Icon } from '@iconify/vue';
</script>

<template>
    <footer class="w-full h-fit px-20 py-36 bg-gradient-to-b dark:bg-gradient-to-t from-neutral-50 to-zinc-300 dark:from-zinc-950 dark:to-neutral-900 border-t border-zinc-200 dark:border-zinc-700">
        <div class="flex flex-col gap-4">
            <!-- Github Link -->
            <NuxtLink
                class="flex max-w-fit dark:bg-transparent text-black dark:text-white hover:text-zinc-500 dark:hover:text-zinc-400 hover:bg-green3 focus:shadow-green7 select-none rounded-md px-3 py-2 text-md font-normal leading-none no-underline outline-none focus:shadow-[0_0_0_2px]"
                href="https://github.com/ElijahAlly/FamilyTrees"
            >
                <Icon icon="mdi:github" class="text-inherit mx-2" /> 
                <span class="text-inherit">Github</span>
            </NuxtLink>

            <!-- Legal Links -->
            <div class="flex gap-4">
                <NuxtLink
                    to="/privacy-policy"
                    class="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 text-sm"
                >
                    Privacy Policy
                </NuxtLink>
                <NuxtLink
                    to="/terms-of-service"
                    class="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 text-sm"
                >
                    Terms of Service
                </NuxtLink>
            </div>
        </div>
    </footer>
</template>