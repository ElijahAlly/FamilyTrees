<script setup lang="ts">
const props = defineProps({
    title: { type: String, default: '' },
})
</script>

<template>
    <li>
        <NavigationMenuLink as-child>
            <a v-bind="$attrs"
                class="border border-transparent hover:border-zinc-400 dark:hover:border-zinc-50 focus:shadow-[0_0_0_2px] focus:shadow-green7 hover:bg-mauve3 block select-none rounded-md p-3 text-[15px] leading-none no-underline outline-none hover:outline-none transition-colors">
                <div class="text-green12 mb-[5px] font-medium leading-[1.2]">
                    {{ props.title }}
                </div>
                <p class="text-mauve11 my-0 leading-[1.4]">
                    <slot></slot>
                </p>
            </a>
        </NavigationMenuLink>
    </li>
</template>