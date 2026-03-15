<script setup lang="ts">
import NavigationMenu from './NavigationMenu.vue';
import ProfileMenu from './ProfileMenu.vue';
import ThemeToggler from '../ui/ThemeToggler.vue';
import { useTypewriter } from '@/composables/useTypewriter';
import { useFamilyStore } from '@/stores/useFamily';
import { storeToRefs } from 'pinia';
import { watch, onMounted } from 'vue';

const familyStore = useFamilyStore();
const { family } = storeToRefs(familyStore);
const { profile } = storeToRefs(useAuthStore());

const { displayText, deleteText } = useTypewriter(`${family.value?.familyName || 'Family'}`, 180, 150);

const toObj = computed<{title: string, link: string}>(() => {
    return {
        title: family.value ? `View ${family.value.familyName} Tree` : 'Home',
        link: family.value && profile.value ? `/member/${profile.value.id}/tree/${family.value.id}` : '/'
    }
});

watch(family, async (newFamily) => {
    if (newFamily?.familyName) {
        if (displayText.value !== newFamily.familyName) {
            await deleteText(displayText.value, newFamily.familyName);
        }
    } else if (displayText.value !== 'Family') {
        await deleteText(displayText.value, 'Family');
    }
}, { immediate: false })

onMounted(() => {
    if (family.value?.familyName) {
        displayText.value = family.value.familyName;
    } else {
        displayText.value = 'Family';
    }
})
</script>

<template>
    <nav
        class="sticky top-0 left-0 w-full flex items-center h-14 px-4 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md z-50 border-b border-zinc-200 dark:border-zinc-800">
        <div class="flex items-center justify-between w-full">
            <NuxtLink :to="toObj.link" :title="toObj.title" class="shrink-0">
                <h2 class="text-2xl font-extralight text-zinc-950 dark:text-zinc-200">MyTrees.{{ displayText }}</h2>
            </NuxtLink>
            <div class="flex items-center gap-2">
                <NavigationMenu />
                <ProfileMenu />
                <ThemeToggler />
            </div>
        </div>
    </nav>
</template>
