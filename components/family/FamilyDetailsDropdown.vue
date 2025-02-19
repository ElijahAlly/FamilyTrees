<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { ref } from 'vue';
import { useDraggableZoneStore } from '@/stores/draggableZone';
import { storeToRefs } from 'pinia';

const { title } = defineProps({
    title: { type: String, required: true }
})

const draggableZoneStore = useDraggableZoneStore();
const { isFullPageDropdownOpen } = storeToRefs(draggableZoneStore);

const toggleDropdown = () => {
    isFullPageDropdownOpen.value = !isFullPageDropdownOpen.value;
}
</script>

<template>
    <div class="relative w-full">
        <button 
            @click="toggleDropdown"
            class="absolute top-0 left-1/2 -translate-x-1/2 z-40 px-3 py-1 text-black dark:text-white bg-zinc-100 dark:bg-zinc-800 rounded-b-md shadow-md hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors duration-200 flex items-center border border-t-0 hover:border-zinc-300 dark:border-zinc-600 dark:hover:border-zinc-100"
        >
        <span>{{ isFullPageDropdownOpen ? 'Hide' : 'Show' }} {{ title }}</span>
        <Icon
            icon="mdi:chevron-down"
            :class="{'rotate-180': isFullPageDropdownOpen}"
            class="transition-transform duration-200 h-4 w-4 ml-1"
        />
        </button>

        <Transition
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="transform -translate-y-full opacity-0"
            enter-to-class="transform translate-y-0 opacity-100"
            leave-active-class="transition duration-200 ease-in"
            leave-from-class="transform translate-y-0 opacity-100"
            leave-to-class="transform -translate-y-full opacity-0"
        >
            <div v-if="isFullPageDropdownOpen" class="absolute top-0 left-0 w-full h-[92vh] bg-zinc-100/95 dark:bg-zinc-800/95 backdrop-blur-sm z-30 p-8 shadow-lg border-b border-zinc-300 dark:border-zinc-600">
                <slot name="content"></slot>
            </div>
        </Transition>
    </div>
</template>