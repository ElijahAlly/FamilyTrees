<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { NavigationMenuItem, NavigationMenuTrigger, NavigationMenuContent, NavigationMenuLink } from 'radix-vue';

</script>

<template>
    <NavigationMenuItem class="mr-3">
        <NavigationMenuTrigger
            class="text-black dark:text-white hover:text-zinc-500 dark:hover:text-zinc-400 border border-black dark:border-white hover:border-zinc-500 dark:hover:border-zinc-400 
                shadow-none group flex select-none items-center justify-between gap-[2px] rounded-md px-3 py-2 text-[15px] leading-none outline-none focus:outline-none focus:shadow-none"
        >
            <span>Discover</span>
            <Icon icon="radix-icons:caret-down"
                class="relative top-[1px] transition-transform duration-[250ms] ease-in group-data-[state=open]:-rotate-180" />
        </NavigationMenuTrigger>
        <NavigationMenuContent
            class="bg-gradient-to-b z-50 from-zinc-300 to-neutral-50 dark:from-zinc-900 dark:to-neutral-950 shadow-xl data-[motion=from-start]:animate-enterFromLeft 
                data-[motion=from-end]:animate-enterFromRight data-[motion=to-start]:animate-exitToLeft data-[motion=to-end]:animate-exitToRight absolute top-0 left-0"
        >
            <ul class="one m-0 grid list-none gap-x-[10px] p-[22px] sm:w-[500px] sm:grid-cols-[0.75fr_1fr] overflow-y-scroll max-h-[300px]">
                <!-- <li class="row-span-3 grid">
                    <NavigationMenuLink as-child>
                        <NuxtLink to="/"
                            class="focus:shadow-green7 from-green9 to-teal9 flex h-full w-full select-none border border-transparent hover:border-zinc-400 dark:hover:border-zinc-50 
                                flex-col justify-end rounded-[6px] bg-gradient-to-t p-[25px] no-underline outline-none focus:shadow-[0_0_0_2px] hover:shadow-md transition-all"
                        >
                            <div class="mb-[7px] text-[18px] font-medium leading-[1.2] dark:text-white">Learn
                                More
                                <span class="inline-block">
                                    <Icon icon="radix-icons:chevron-right" class="pt-1" />
                                </span>
                            </div>
                            <p class="text-mauve4 text-[14px] leading-[1.3] dark:text-white">Private, Shareable,
                                and easy to use for the whole family!</p>
                        </NuxtLink>
                    </NavigationMenuLink>
                </li> -->

                <li>
                    <NavigationMenuLink as-child>
                        <NuxtLink to="/discover" class="border border-opacity-30 hover:border-opacity-100 border-zinc-400 dark:border-zinc-50 hover:shadow-md
                            block select-none rounded-md p-3 text-[15px] leading-none no-underline outline-none hover:outline-none transition-all"
                        >
                            <div class="text-black mb-[5px] font-medium leading-[1.2] dark:text-white text-nowrap">
                                View Your Family Trees 
                                <span class="inline-block">
                                    <Icon icon="radix-icons:chevron-right" class="pt-1" />
                                </span>
                            </div>
                            <p class="text-black dark:text-white my-0 leading-[1.4]">
                                <span>Search for your family members & discover your roots now!</span>
                            </p>
                        </NuxtLink>
                    </NavigationMenuLink>
                </li>
            </ul>
        </NavigationMenuContent>
    </NavigationMenuItem>
</template>