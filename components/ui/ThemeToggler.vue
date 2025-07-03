<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useColorMode } from '@vueuse/core';
import Toggle from './Toggle.vue';
import { ShortcutSectionName, useHotkeys } from '../../composables/useHotkeys';

const colorMode = useColorMode();
const { setHotkeysActions } = useHotkeys();
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

watch(isDark, (newVal) => {
    toggleColorMode(newVal);
});

onMounted(() => {
    const localValue = localStorage.getItem('ft-theme');
    const savedTheme = localValue ? localValue === 'dark' : isDark.value;
    isDark.value = savedTheme;
    toggleColorMode(savedTheme);

    setHotkeysActions(ShortcutSectionName.GLOBAL, {
        'd': { action: () => isDark.value = !isDark.value }
    })
});
</script>

<template>
    <Toggle 
        v-model="isDark" 
        :title="`Enter ${isDark ? 'light' : 'dark'} mode (Shift+D)`" 
        darkVariant 
    />
</template>