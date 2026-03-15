<script setup lang="ts">
import { computed } from 'vue';
import { useDraggableZoneStore } from '@/stores/useDraggableZone';
import { storeToRefs } from 'pinia';
import PersonInfoSidebar from './PersonInfoSidebar.vue';
import TreeViewSettingsSidebar from './TreeViewSettingsSidebar.vue';

const { isNative } = useDevice();
const draggableZoneStore = useDraggableZoneStore();
const { curBackgroundPattern, curBackgroundColor, treeCustomization } = storeToRefs(draggableZoneStore);

const containerStyle = computed(() => {
    const style: Record<string, string> = {
        backgroundColor: curBackgroundColor.value.hex,
    };
    if (curBackgroundPattern.value === 'dot-background') {
        style.backgroundImage = `radial-gradient(circle, ${treeCustomization.value.gridDotColor} 1.2px, transparent 1px)`;
        style.backgroundSize = '20px 20px';
    }
    return style;
});
</script>

<template>
  <div :class="['relative w-full flex flex-col items-center justify-center overflow-visible', isNative ? 'h-[calc(100vh-env(safe-area-inset-top)-env(safe-area-inset-bottom))]' : 'h-[calc(100vh-3.5rem)]', curBackgroundPattern === 'tree-background' ? 'tree-background' : '']"
    :style="containerStyle">
    <TreeViewSettingsSidebar />
    <PersonInfoSidebar />
    <slot></slot>
  </div>
</template>

<style scoped>
.tree-background {
  background-image: url('/trees-logo-repeat.png');
  background-size: 20px 20px;
  background-repeat: repeat;
}
</style>