<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { storeToRefs } from 'pinia';
import { navigateTo } from 'nuxt/app';
import { 
    NavigationMenuItem, NavigationMenuTrigger, NavigationMenuContent, 
    NavigationMenuLink, NavigationMenuIndicator, NavigationMenuRoot, NavigationMenuList,
    NavigationMenuViewport
} from 'radix-vue';
import NavigationMenuListItem from './NavigationMenuListItem.vue';

const authStore = useAuthStore();
const { logout } = authStore;
const { user } = storeToRefs(authStore);

const currentTrigger = ref('');

const handleLogout = async () => {
    try {
        await logout();
        await navigateTo('/')
    } catch (error) {
        console.error('Logout failed:', error)
    }
}
</script>

<template>
    <NavigationMenuRoot v-model="currentTrigger" class="relative z-[1] flex w-full justify-center bg-transparent">
        <NavigationMenuList
            class="center shadow-blackA7 m-0 flex items-center list-none bg-transparent p-1">
            <NavigationMenuItem class="mr-3">
                <NavigationMenuTrigger
                    class="text-black dark:text-white hover:text-zinc-500 dark:hover:text-zinc-400 border border-black dark:border-white hover:border-zinc-500 dark:hover:border-zinc-400 shadow-none group flex select-none items-center justify-between gap-[2px] rounded-md px-3 py-2 text-[15px] leading-none outline-none focus:outline-none focus:shadow-none">
                    Discover
                    <Icon icon="radix-icons:caret-down"
                        class="relative top-[1px] transition-transform duration-[250ms] ease-in group-data-[state=open]:-rotate-180" />
                </NavigationMenuTrigger>
                <NavigationMenuContent
                    class="bg-gradient-to-b z-50 from-zinc-300 to-neutral-50 dark:from-zinc-900 dark:to-neutral-950 shadow-xl data-[motion=from-start]:animate-enterFromLeft data-[motion=from-end]:animate-enterFromRight data-[motion=to-start]:animate-exitToLeft data-[motion=to-end]:animate-exitToRight absolute top-0 left-0 w-full sm:w-auto"
                >
                    <ul class="one m-0 grid list-none gap-x-[10px] p-[22px] sm:w-[500px] sm:grid-cols-[0.75fr_1fr]">
                        <li class="row-span-3 grid">
                            <NavigationMenuLink as-child>
                                <NuxtLink 
                                    class="focus:shadow-green7 from-green9 to-teal9 flex h-full w-full select-none border border-transparent hover:border-zinc-400 dark:hover:border-zinc-50 flex-col justify-end rounded-[6px] bg-gradient-to-t p-[25px] no-underline outline-none focus:shadow-[0_0_0_2px]"
                                    to="/"
                                >
                                    <!-- <NuxtImg src="/my-trees-logo.png" class="cursor-pointer rounded-md w-16" /> -->
                                    <div class="mb-[7px] text-[18px] font-medium leading-[1.2] dark:text-white">Family Trees</div>
                                    <p class="text-mauve4 text-[14px] leading-[1.3] dark:text-white">Private, Shareable, and easy to use for the whole family!</p>
                                </NuxtLink>
                            </NavigationMenuLink>
                        </li>

                        <NavigationMenuLink as-child>
                            <NuxtLink to="/discover">
                                <NavigationMenuListItem title="View Your Family Trees" class="dark:text-white">
                                    Search for your family members & discover your roots now! <span class="inline-block"><Icon icon="radix-icons:chevron-right"/></span>
                                </NavigationMenuListItem>
                            </NuxtLink>
                        </NavigationMenuLink>
                    </ul>
                </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
                <NavigationMenuLink>
                    <NuxtLink v-if="!user" to="/signup" class="flex dark:bg-transparent text-black dark:text-white hover:text-zinc-500 dark:hover:text-zinc-400 hover:bg-green3 border border-black dark:border-white hover:border-zinc-500 dark:hover:border-zinc-400 select-none rounded-md px-3 py-2 text-md font-normal leading-none no-underline outline-none focus:outline-none focus:shadow-none">
                        <Icon icon="mdi:user" class="text-inherit mr-2" /> 
                        <span class="text-inherit">Sign Up/Sign in</span>
                    </NuxtLink>
                    <button v-else @click="handleLogout" class="flex dark:bg-transparent text-black dark:text-white hover:text-zinc-500 dark:hover:text-zinc-400 hover:bg-green3 border border-black dark:border-white hover:border-zinc-500 dark:hover:border-zinc-400 select-none rounded-md px-3 py-2 text-md font-normal leading-none no-underline outline-none focus:outline-none focus:shadow-none">
                        <Icon icon="mdi:logout" class="text-inherit mr-2" />
                        <span class="text-inherit">Logout</span>
                    </button>
                </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuIndicator
                class="data-[state=hidden]:opacity-0 duration-200 data-[state=visible]:animate-fadeIn data-[state=hidden]:animate-fadeOut top-full z-[1] flex h-[10px] items-end justify-center overflow-hidden transition-[all,transform_250ms_ease]">
                <div class="relative top-[70%] h-[10px] w-[10px] rotate-[45deg] rounded-tl-[2px] bg-zinc-300 dark:bg-zinc-900"></div>
            </NavigationMenuIndicator>
        </NavigationMenuList>

        <div class="perspective-[2000px] absolute top-full left-0 flex w-full justify-center">
            <NavigationMenuViewport
                class="data-[state=open]:animate-scaleIn data-[state=closed]:animate-scaleOut relative mt-[10px] h-[var(--radix-navigation-menu-viewport-height)] w-full origin-[top_center] overflow-hidden rounded-[10px] bg-white transition-[width,_height] duration-300 sm:w-[var(--radix-navigation-menu-viewport-width)]" />
        </div>
    </NavigationMenuRoot>
</template>