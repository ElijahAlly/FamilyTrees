<script setup lang="ts">
import { useFamilyStore } from '@/stores/useFamily';
import { storeToRefs } from 'pinia';
import { ref, watch } from 'vue';
import { useTypewriter } from '@/composables/useTypewriter';
import FamilyDetailsCard from './FamilyDetailsCard.vue';

const familyStore = useFamilyStore();
const { currentFamilyTree, family, shownFamilyDetails, isFamilyTreePrivate } = storeToRefs(familyStore);

const { displayText, isTyping, typeText, reset } = useTypewriter(`The ${family.value?.family_name || ''} Family`, 90, 300);

const familyCodeInput = ref('');

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
    <div v-if="family && currentFamilyTree"
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
            <div v-if="!isTyping && family.id" class="w-full h-[calc(92vh-4rem)] z-30 p-8 shadow-lg border-b border-zinc-300 dark:border-zinc-600">
                <FamilyDetailsCard 
                    :text="`You have ${ family.members.length } family member${ family.members.length > 1 ? 's' : '' } in your tree.`"
                    type="button" 
                />
                <FamilyDetailsCard :text="`Your family tree is ${isFamilyTreePrivate ? 'private & only visible by a link' : 'visible to anyone'}.`">
                    <template #default v-if="isFamilyTreePrivate">
                        <div class="w-fit flex flex-col">
                            <input 
                                v-model="familyCodeInput"
                                name="family-code"
                                class="!bg-transparent px-2 py-1 my-3 border rounded-md outline-none text-grass11 h-full w-full selection:bg-grass5 placeholder-mauve8 dark:text-white"
                                placeholder="Create your family tree access code." 
                            />
                            <label for="family-code" class="flex flex-col text-sm text-zinc-800 dark:text-white font-light italic">
                                Nobody outside your family will be able to visit your tree without this code. 
                                <span>You can change it at anytime.</span>
                            </label>
                        </div>
                    </template>
                </FamilyDetailsCard>
            </div>
        </Transition>
    </div>
</template>
