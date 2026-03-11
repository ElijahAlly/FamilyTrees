<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref } from 'vue';
import { useAuthStore } from '@/stores/useAuth';
import { storeToRefs } from 'pinia';
import { 
    NavigationMenuItem, NavigationMenuLink, NavigationMenuIndicator, 
    NavigationMenuRoot, NavigationMenuList, NavigationMenuViewport
} from 'radix-vue';
import DiscoverDropdown from './DiscoverDropdown.vue';

const authStore = useAuthStore();
const { signOut } = authStore;
const { isAuthenticated } = storeToRefs(authStore);

const currentTrigger = ref('');
</script>

<template>
    <NavigationMenuRoot v-model="currentTrigger" class="relative z-[1] w-3/5 flex items-center bg-transparent">
        <NavigationMenuList class="center shadow-blackA7 m-0 flex items-center list-none bg-transparent p-1">
            <DiscoverDropdown />

            <NavigationMenuItem>
                <NavigationMenuLink as-child>
                    <NuxtLink v-if="!isAuthenticated" to="/signup"
                        class="flex dark:bg-transparent text-black dark:text-white hover:text-zinc-500 dark:hover:text-zinc-400 hover:bg-green3 
                            border border-black dark:border-white hover:border-zinc-500 dark:hover:border-zinc-400 select-none rounded-md px-3 py-2 
                            text-md font-normal leading-none no-underline outline-none focus:outline-none focus:shadow-none">
                        <Icon icon="mdi:user" class="text-inherit mr-2" />
                        <span class="text-inherit">Login/Sign Up</span>
                    </NuxtLink>
                    <button v-else @click="signOut"
                        class="flex dark:bg-transparent text-red-600 dark:text-red-600 hover:text-red-700 dark:hover:text-red-400 hover:bg-green3 
                            border border-red-600 hover:border-red-700 dark:hover:border-red-400 select-none rounded-md px-3 py-2 text-md font-normal 
                            leading-none no-underline outline-none focus:outline-none focus:shadow-none transition-all duration-150">
                        <Icon icon="mdi:logout" class="text-inherit mr-2" />
                        <span class="text-inherit">Logout</span>
                    </button>
                </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuIndicator class="data-[state=hidden]:opacity-0 duration-200 data-[state=visible]:animate-fadeIn data-[state=hidden]:animate-fadeOut top-full z-[1] 
                    flex h-[10px] items-end justify-center overflow-hidden transition-[all,transform_250ms_ease]">
                <div
                    class="relative top-[70%] h-[10px] w-[10px] rotate-[45deg] rounded-tl-[2px] bg-zinc-300 dark:bg-zinc-900">
                </div>
            </NavigationMenuIndicator>
        </NavigationMenuList>

        <div class="perspective-[2000px] absolute top-full left-0 flex w-full justify-center">
            <NavigationMenuViewport
                class="data-[state=open]:animate-scaleIn data-[state=closed]:animate-scaleOut relative mt-[10px] h-[var(--radix-navigation-menu-viewport-height)] w-full 
                origin-[top_center] overflow-hidden rounded-[10px] bg-white transition-[width,_height] duration-300 sm:w-[var(--radix-navigation-menu-viewport-width)]" />
        </div>
    </NavigationMenuRoot>
</template>