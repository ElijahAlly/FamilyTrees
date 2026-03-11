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
    document.documentElement.style.backgroundColor = newVal ? '#18181b' : '#d4d4d8';
    document.documentElement.classList.toggle('dark-mode', newVal);
    document.documentElement.classList.toggle('light-mode', !newVal);
    localStorage.setItem('ft-theme', newVal ? 'dark' : 'light');
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
    <ClientOnly>
        <Toggle 
            v-model="isDark" 
            :title="`Enter ${isDark ? 'light' : 'dark'} mode (Shift+D)`" 
            darkVariant 
        />
    </ClientOnly>
</template>