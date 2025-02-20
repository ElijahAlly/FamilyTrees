<script setup lang="ts">
import NavigationMenu from './NavigationMenu.vue';
import ThemeToggler from '../ui/ThemeToggler.vue';
import { useTypewriter } from '@/composables/useTypewriter';
import { useFamilyStore } from '@/stores/family';
import { storeToRefs } from 'pinia';
import { watch, onMounted } from 'vue';

const familyStore = useFamilyStore();
const { curentFamilyTree, family, shownFamilyDetails } = storeToRefs(familyStore);

const { displayText, isTyping, isDeleting, typeText, deleteText, reset } = useTypewriter(`${family.value?.family_name || 'Family'}`, 180, 150);

watch(family, async (newFamily) => {
    if (newFamily?.family_name) {
        if (displayText.value !== newFamily.family_name) {
            await deleteText(displayText.value, newFamily.family_name);
        }
    } else if (displayText.value !== 'Family') {
        await deleteText(displayText.value, 'Family');
    }
})

onMounted(() => {
    if (family.value?.family_name) {
        displayText.value = family.value.family_name;
    } else {
        displayText.value = 'Family';
    }
})
</script>

<template>
    <nav
        class="sticky top-0 left-0 w-full flex items-center min-h-[8vh] max-h-[8vh] p-4 bg-gradient-to-b from-zinc-300 to-neutral-50 dark:from-zinc-900 dark:to-neutral-950 z-50 border-b border-zinc-200 dark:border-zinc-700"
    >
        <div class="flex items-center rounded-md p-3 w-full">
            <NuxtLink to="/" class="w-fit min-w-[420px] -mr-[228px]">
                <!-- <NuxtImg src="/my-trees-logo-with-name.png" class="cursor-pointer rounded-md hover:shadow-md" height="99" /> -->
                <h2 class="text-3xl font-extralight text-zinc-950 dark:text-zinc-200">MyTrees.{{ displayText }}</h2>
            </NuxtLink>
            <NavigationMenu />
            <ThemeToggler />
        </div>
    </nav>
</template>