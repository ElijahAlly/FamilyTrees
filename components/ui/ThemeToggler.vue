<script setup lang="ts">
import { watch, onMounted, ref } from 'vue';
import { useColorMode } from '@vueuse/core';

const colorMode = useColorMode();
const isDark = ref<boolean>(colorMode.value === 'dark');

const toggleColorMode = (newVal: boolean) => {
    colorMode.value = newVal ? 'dark' : 'light';
    if (newVal) {
        document.documentElement.classList.add('dark-mode');
        document.documentElement.classList.remove('light-mode');
        localStorage.setItem('ft-theme', 'dark');
    } else {
        document.documentElement.classList.remove('dark-mode');
        document.documentElement.classList.add('light-mode');
        localStorage.setItem('ft-theme', 'light');
    }
};

const toggleIsDark = () => {
    isDark.value = !isDark.value;
}

watch(isDark, (newVal) => {
    toggleColorMode(newVal);
});

onMounted(() => {
    const localValue = localStorage.getItem('ft-theme');
    const savedTheme = localValue ? localValue === 'dark' : isDark.value;
    isDark.value = savedTheme;
    toggleColorMode(savedTheme);
});
</script>

<template>
    <div class="group relative inline-flex items-center rounded-full border-2 border-zinc-600/60 dark:border-white/60"
        :title="`Enter ${isDark ? 'light' : 'dark'} mode`">
        <input id="theme-toggler" type="checkbox" @change="toggleIsDark" :checked="isDark" class="peer sr-only" />
        <label for="theme-toggler"
            class="relative h-6 w-11 cursor-pointer rounded-full bg-zinc-500/50 dark:peer-checked:bg-zinc-300/50 transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-zinc-50 dark:after:bg-zinc-800 after:transition-all after:content-[''] peer-checked:bg-black peer-checked:after:translate-x-full peer-focus:outline-none">
            <span class="sr-only">Toggle theme</span>
        </label>
    </div>
</template>