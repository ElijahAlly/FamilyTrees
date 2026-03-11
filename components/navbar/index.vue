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
const { isAuthenticated, profile } = storeToRefs(useAuthStore());

const { displayText, deleteText } = useTypewriter(`${family.value?.family_name || 'Family'}`, 180, 150);

const toObj = computed<{title: string, link: string}>(() => {
    return {
        title: family.value ? `View ${family.value.family_name} Tree` : 'Home',
        link: family.value && profile.value ? `/member/${profile.value.id}/tree/${family.value.id}` : '/'
    }
});

watch(family, async (newFamily) => {
    if (newFamily?.family_name) {
        if (displayText.value !== newFamily.family_name) {
            await deleteText(displayText.value, newFamily.family_name);
        }
    } else if (displayText.value !== 'Family') {
        await deleteText(displayText.value, 'Family');
    }
}, { immediate: false })

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
        class="sticky top-0 left-0 w-full flex items-center min-h-[8vh] max-h-[8vh] p-4 bg-gradient-to-b from-zinc-300 to-neutral-50 dark:from-zinc-900 dark:to-neutral-950 z-50 border-b border-zinc-200 dark:border-zinc-700">
        <div class="flex items-center justify-between rounded-md p-3 w-full">
            <NuxtLink :to="toObj.link" :title="toObj.title" class="w-fit max-w-fit">
                <h2 class="text-3xl font-extralight text-zinc-950 dark:text-zinc-200">MyTrees.{{ displayText }}</h2>
            </NuxtLink>
            <div class="flex items-center justify-between w-1/2">
                <NavigationMenu />
                <div class="flex items-center">
                    <ProfileMenu v-if="isAuthenticated" />
                    <ThemeToggler />
                </div>
            </div>
        </div>
    </nav>
</template>