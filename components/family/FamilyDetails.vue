<script setup lang="ts">
import { useFamilyStore } from '@/stores/family';
import { storeToRefs } from 'pinia';
import { ref, onMounted, watch } from 'vue';
import { useTypewriter } from '@/composables/useTypewriter';

const familyStore = useFamilyStore();
const { curentFamilyTree, family, shownFamilyDetails } = storeToRefs(familyStore);

const { displayText, isTyping, typeText, reset } = useTypewriter(`The ${family.value?.family_name || ''} Family`, 150, 300);

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
    <div v-if="family && curentFamilyTree" class="min-w-full h-fit p-6 mt-6 overflow-y-auto border rounded-md bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white backdrop-blur-none">
        <h1 class="font-extralight text-4xl">
            <span v-if="shownFamilyDetails">The {{ family.family_name }} Family</span>
            <span v-else class="relative inline-block min-w-[1px]">
                <span class="relative">
                    {{ displayText }}
                    <span 
                        v-if="isTyping" 
                        class="absolute top-0 -right-[2px]"
                    >|</span>
                </span>
                <span class="invisible">{{ family.family_name }}</span>
            </span>
        </h1>
    </div>
</template>
