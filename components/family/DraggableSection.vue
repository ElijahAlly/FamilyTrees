<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue';
import { useDraggableZoneStore } from '@/stores/draggableZone';
import { storeToRefs } from 'pinia';
import PersonInfoSidebar from './PersonInfoSidebar.vue';
import TreeViewSettingsSidebar from './TreeViewSettingsSidebar.vue';

const draggableZoneStore = useDraggableZoneStore();
const { curBackgroundPattern, curBackgroundColor } = storeToRefs(draggableZoneStore);

// TODO: Create a toast message component that appears in the middle of the page at the bottom to display messages for a set duration (3-9 seconds)
// - Display message `Click on a person to view their information` a few seconds after the page is first loaded (have an option to click `Do Not Show Again`)
</script>

<template>
  <div 
    class="relative h-[92vh] w-full flex flex-col items-center justify-center overflow-visible" 
    :class="[curBackgroundPattern]" 
    :style="{ backgroundColor: curBackgroundColor.hex }"
  >
    <TreeViewSettingsSidebar />
    <PersonInfoSidebar />
    <slot></slot>
  </div>
</template>

<style scoped>
.dot-background {
  background-image: radial-gradient(circle, #ede9fe 1.2px, transparent 1px);
  background-size: 20px 20px;
}

.tree-background {
  background-image: url('/trees-logo-repeat.png');
  background-size: 20px 20px;
  background-repeat: repeat;
}
</style>