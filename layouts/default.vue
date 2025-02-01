<script lang="ts" setup>
const colorMode = useColorMode()

watch(colorMode, (newVal) => {
    if (newVal.value === 'dark') {
        document.documentElement.style.backgroundColor = '#18181b'; // zinc-900 or // '#4c1d95' // violet-900;
    } else {
        document.documentElement.style.backgroundColor = '#d4d4d8'; // zinc-900 or // '#c4b5fd'; // violet-300;
    }
})

onMounted(() => {
    if (colorMode.value === 'dark') {
        document.documentElement.style.backgroundColor = '#18181b';
    } else {
        document.documentElement.style.backgroundColor = '#d4d4d8'; 
    }
})
</script>

<template>
    <main class="relative w-screen h-screen overflow-x-hidden overflow-y-auto">
        <Navbar />
        <div :class="`h-fit ${!$route.params?.familyName && !$route.params?.familyId ? 'min-h-screen' : ''} bg-neutral-50 dark:bg-neutral-950`">
            <slot></slot>
        </div>
        <AppFooter v-if="!$route.params?.familyName && !$route.params?.familyId"/>
    </main>
</template>

<style lang="postcss">
::selection {
  @apply bg-violet-600 text-white dark:bg-violet-300 dark:text-black;
}

::-moz-selection {
  @apply bg-violet-600 text-white dark:bg-white dark:text-black;
}
</style>