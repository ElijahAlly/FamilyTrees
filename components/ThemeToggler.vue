<script setup lang="ts">
import { Icon } from '@iconify/vue'

const themeOptions = ['system', 'light', 'dark']; // TODO: Implement 'Sepia'
</script>

<template>
    <div>
        <SelectRoot v-model="$colorMode.preference">
            <SelectTrigger
                class="inline-flex min-w-[96px] items-center justify-between border border-black dark:border-white rounded px-[15px] text-[13px] leading-none h-[35px] gap-[5px] bg-inherit text-grass11 focus:outline-none hover:bg-mauve3 data-[placeholder]:text-green9 outline-none"
                aria-label="Select Theme">
                <SelectValue placeholder="Select a theme" class="dark:text-white" />
                <Icon icon="radix-icons:chevron-down" class="h-3.5 w-3.5 dark:text-white" />
            </SelectTrigger>
            <SelectPortal>
                <SelectContent
                    class="min-w-[160px] bg-white dark:bg-zinc-900 rounded shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)] will-change-[opacity,transform] data-[side=top]:animate-slideDownAndFade data-[side=right]:animate-slideLeftAndFade data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade z-[100]"
                    :side-offset="5">
                    <SelectScrollUpButton
                        class="flex items-center justify-center h-[25px] dark:text-white dark:bg-zinc-900 text-zinc11 cursor-default">
                        <Icon icon="radix-icons:chevron-up" />
                    </SelectScrollUpButton>

                    <SelectViewport class="p-[5px]">
                        <SelectLabel class="px-[25px] text-xs leading-[25px] text-mauve11 dark:text-white">
                            Themes
                        </SelectLabel>
                        <SelectGroup>
                            <SelectItem v-for="(theme, index) in themeOptions" :key="index"
                                class="text-[13px] cursor-pointer leading-none text-grass11 rounded-[3px] flex items-center h-[25px] pr-[35px] pl-[25px] relative select-none data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:outline-none data-[highlighted]:bg-green9 data-[highlighted]:text-green1"
                                :value="theme.toLowerCase()">
                                <SelectItemIndicator
                                    class="absolute left-0 w-[25px] inline-flex items-center justify-center dark:text-white">
                                    <Icon icon="radix-icons:check" />
                                </SelectItemIndicator>
                                <SelectItemText class="dark:text-white">
                                    {{ theme }}
                                </SelectItemText>
                            </SelectItem>
                        </SelectGroup>
                    </SelectViewport>

                    <SelectScrollDownButton
                        class="flex items-center justify-center h-[25px] dark:text-white text-zinc11 cursor-default">
                        <Icon icon="radix-icons:chevron-down" />
                    </SelectScrollDownButton>
                </SelectContent>
            </SelectPortal>
        </SelectRoot>
    </div>
</template>