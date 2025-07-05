<script setup lang="ts">
import { useFamilyStore } from '@/stores/family';
import { storeToRefs } from 'pinia';
import { watch } from 'vue';
import { useTypewriter } from '@/composables/useTypewriter';

const familyStore = useFamilyStore();
const { curentFamilyTree, family, shownFamilyDetails } = storeToRefs(familyStore);

const { displayText, isTyping, typeText, reset } = useTypewriter(`The ${family.value?.family_name || ''} Family`, 90, 300);

watch(isTyping, (newVal) => {
    if (!newVal) { 
        // When typing is done
        familyStore.setShownFamilyDetails(true);
    } else {
        // When typing starts
    }
});

// Watch for changes in family name to restart the animation
watch(family, (newFamily) => {
    reset();
    typeText();
}, { immediate: true })
</script>

<template>
    <div v-if="family && curentFamilyTree"
        class="relative min-w-full mt-6 overflow-y-auto border rounded-md text-black dark:text-white"
        :class="{'h-fit': isTyping, 'h-full': !isTyping}">
        <h1
            class="sticky top-0 left-0 w-full p-6 font-extralight text-4xl z-40 bg-zinc-100 dark:bg-gradient-to-b dark:from-zinc-900 dark:to-neutral-950 border-b">
            <span v-if="shownFamilyDetails">The {{ family.family_name }} Family</span>
            <span v-else class="relative inline-block min-w-[1px]">
                <span class="relative">
                    {{ displayText }}
                    <span v-if="isTyping" class="absolute top-0 -right-[2px]">|</span>
                </span>
                <span class="invisible">{{ family.family_name }}</span>
            </span>
        </h1>
        <Transition enter-active-class="transition duration-300 ease-out"
            enter-from-class="transform -translate-y-full opacity-0"
            enter-to-class="transform translate-y-0 opacity-100" leave-active-class="transition duration-200 ease-in"
            leave-from-class="transform translate-y-0 opacity-100"
            leave-to-class="transform -translate-y-full opacity-0">
            <div v-if="!isTyping"
                class="w-full h-[calc(92vh-4rem)] z-30 p-8 shadow-lg border-b border-zinc-300 dark:border-zinc-600">
                You have {{ family.members.length }} family member{{ family.members.length > 1 ? 's' : '' }} in your
                tree.
            </div>
        </Transition>
    </div>
</template>
