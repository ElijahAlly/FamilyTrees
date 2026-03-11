<script lang="ts" setup>
import { type PropType, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { Text3D } from '@tresjs/cientos';
import { Shape } from 'three';
import { useColorMode, useThrottleFn } from '@vueuse/core';
import type { PersonType } from '@/types';

const props = defineProps({
    person: { type: Object as PropType<PersonType>, required: true },
    position: { type: Array as PropType<number[]>, default: [0, 0, 0], required: true },
});

const text = computed<string>(() => props.person ? props.person.first_name : '');
const colorMode = useColorMode();
const { isMobile } = useDevice();
const isHoveringPerson = ref<boolean>(false);

// Add text configuration
const textOptions = ref({
    size: 0.001, // Start very small but not zero
    height: 0.001,
    curveSegments: 9,
    bevelEnabled: true,
    bevelThickness: 0.001,
    bevelSize: 0.0001,
    bevelOffset: 0,
    bevelSegments: 1
});

const TARGET_SIZE = 0.15; // Reduced from 0.15 to make text smaller
const ANIMATION_DURATION = 300; // milliseconds
const STEP_TIME = 16; // ~60fps
const SIZE_INCREMENT = (TARGET_SIZE / ANIMATION_DURATION) * STEP_TIME;

let animationFrame: number;

const animateTextSize = () => {
    if (textOptions.value.size < TARGET_SIZE) {
        textOptions.value.size = Math.min(
            textOptions.value.size + SIZE_INCREMENT,
            TARGET_SIZE
        );
        animationFrame = requestAnimationFrame(animateTextSize);
    }
};

// Start animation when component mounts
onMounted(() => {
    animationFrame = requestAnimationFrame(animateTextSize);
});

// Watch for person changes to restart animation
watch(() => props.person, (newVal, oldVal) => {
    if (newVal?.id !== oldVal?.id) {
        // Cancel existing animation
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
        }
        // Reset size and start new animation
        textOptions.value.size = 0.001;
        animationFrame = requestAnimationFrame(animateTextSize);
    }
}, { deep: true });

// Clean up on unmount
onBeforeUnmount(() => {
    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
    }
});

// Adjust background calculations for smaller text
const padding = 0.1; // Reduced from 0.1
const backgroundDepth = 0.005;
const borderRadius = 0.06; // Reduced from 0.05

const estimatedTextActualWidth = computed(() => {
    const averageCharWidthRatio = 0.66;
    return text.value.length * textOptions.value.size * averageCharWidthRatio;
});

const backgroundWidth = computed(() => {
    return estimatedTextActualWidth.value + (padding * text.value.length);
});

const backgroundHeight = computed(() => textOptions.value.size + padding);

const backgroundPosition = computed<[number, number, number]>(() => {
    const [x, y, z] = props.position;
    const textWidthOffset = backgroundWidth.value * 0.3; // Adjust this multiplier as needed

    return [
        x + textWidthOffset, // Use actual text width for X offset
        y + 0.06, // Fixed small Y offset
        z - (backgroundDepth / 2) - 0.005
    ];
});

// Create the rounded rectangle Shape for the background
const roundedRectShape = computed(() => {
    const width = backgroundWidth.value;
    const height = backgroundHeight.value;
    // Ensure radius doesn't exceed half the width or height
    const radius = Math.min(borderRadius, width / 2, height / 2);

    const shape = new Shape();

    // Start at the top-left corner (adjusted by radius for the arc)
    shape.moveTo(-width / 2 + radius, height / 2);

    // Top edge and top-right arc
    shape.lineTo(width / 2 - radius, height / 2);
    shape.absarc(width / 2 - radius, height / 2 - radius, radius, Math.PI / 2, 0, true);

    // Right edge and bottom-right arc
    shape.lineTo(width / 2, -height / 2 + radius);
    shape.absarc(width / 2 - radius, -height / 2 + radius, radius, 0, -Math.PI / 2, true);

    // Bottom edge and bottom-left arc
    shape.lineTo(-width / 2 + radius, -height / 2);
    shape.absarc(-width / 2 + radius, -height / 2 + radius, radius, -Math.PI / 2, Math.PI, true);

    // Left edge and top-left arc
    shape.lineTo(-width / 2, height / 2 - radius);
    shape.absarc(-width / 2 + radius, height / 2 - radius, radius, Math.PI, Math.PI / 2, true);

    return shape;
});

// Extrude settings for the background geometry
const extrudeSettings = {
    steps: 1, // Number of points along the z-axis
    depth: backgroundDepth, // The thickness of the extrusion
    bevelEnabled: false, // We usually don't want bevels on the background for simplicity
};

const handleMouseOverPerson = useThrottleFn(() => {
    if (isHoveringPerson.value || isMobile.value) return;
    isHoveringPerson.value = true;
    // alert(`Hovered: ${props.person.first_name}`);
}, 900);

const handleMouseLeavePerson = useThrottleFn(() => {
    if (!isHoveringPerson.value || isMobile.value) return;
    isHoveringPerson.value = false;
}, 900);
</script>

<template>
    <TresGroup @pointer-enter="handleMouseOverPerson" @pointer-leave="handleMouseLeavePerson">
        <!-- Single rounded 3D background -->
        <TresMesh :position="backgroundPosition" :key="`bg-${text}`">
            <!-- Use TresExtrudeGeometry and pass the computed shape and extrude settings -->
            <TresExtrudeGeometry :args="[roundedRectShape, extrudeSettings]" />
            <TresMeshBasicMaterial :color="colorMode === 'dark' ? '#ffffff' : '#000000'" :transparent="true"
                :opacity="0.99" />
        </TresMesh>

        <!-- Text -->
        <Text3D :position="position" :key="`text-${text}`"
            font="https://raw.githubusercontent.com/Tresjs/assets/main/fonts/FiraCodeRegular.json" v-bind="textOptions">
            {{ text }}
            <TresMeshBasicMaterial :color="colorMode === 'dark' ? '#000000' : '#ffffff'" />
        </Text3D>
    </TresGroup>
</template>