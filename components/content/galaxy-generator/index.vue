<script setup lang="ts">
import { watch } from 'vue';
import { useRafFn } from '@vueuse/core'
import { defineProps, ref, onMounted, onUnmounted } from 'vue';
import { BasicShadowMap, SRGBColorSpace, NoToneMapping, Color, AdditiveBlending } from 'three';
import { vertexShader, fragmentShader } from './shaders';
import { useColorMode } from '@vueuse/core';
import type { FamilyType } from '@/types/family';

const props = defineProps({ 
    isHoveringHero: { type: Boolean, default: false, required: true },
    isGalaxyAnimationPaused: { type: Boolean, default: false, required: true },
})

const trees = ref<FamilyType[]>([
    { id: 1, family_name: 'Anderson', members: [1,2,3] },
    { id: 2, family_name: 'Smith', members: [4,5] },
    { id: 3, family_name: 'Williams', members: [6,7,8,9] },
]);

const colorMode = useColorMode()

function getRandomNumber(min: number, max: number, decimals: number = 2): number {
    return Number((Math.random() * (max - min) + min).toFixed(decimals));
}

const gl = ref<any>({
    clearColor: colorMode.value === 'dark' ? '#0a0a0a' : '#fafafa',
    shadows: true,
    alpha: true,
    shadowMapType: BasicShadowMap,
    outputColorSpace: SRGBColorSpace,
    toneMapping: NoToneMapping,
})

watch(colorMode, (newValue) => {
    gl.value.clearColor = newValue === 'dark' ? '#0a0a0a' : '#fafafa'
})

const radius = getRandomNumber(3, 4.2, 1);
const speed = 0.03 * Math.exp(4.2 - radius);
const tilt = getRandomNumber(0.3, 0.8, 1);
const rightTiltAngle = getRandomNumber(0, 9, 1) * (Math.PI / 180); // Tilt to the right
const forwardTiltAngle = rightTiltAngle * 0.8; // Proportional forward tilt (0.8 can be adjusted)
const blackHoleSize = 0.3 + (radius / 4.2) * 0.4; // Will range from 0.3 to 0.7 based on radius

const parameters = {
    count: 60000,
    size: 21,
    radius,
    branches: 4,
    spin: getRandomNumber(1.5, 6, 2),
    randomness: 0.12,
    randomnessPower: 6,
    insideColor: '#ddd6fe',
    outsideColor: '#881337',
    blackHoleSize,
    speed
}

const colorInside = new Color(parameters.insideColor)
const colorOutside = new Color(parameters.outsideColor)

const positions = new Float32Array(parameters.count * 3)
const colors = new Float32Array(parameters.count * 3)
const scales = new Float32Array(parameters.count)
const randomnessArray = new Float32Array(parameters.count * 3)

for (let i = 0; i < parameters.count; i++) {
    const i3 = i * 3

    // Use power distribution for radius to concentrate particles near center
    const radius = Math.pow(Math.random(), 0.42) * parameters.radius;
    const spinAngle = radius * parameters.spin // Initialize with spin angle instead of 0
    const branchAngle = ((i % parameters.branches) * Math.PI * 2) / parameters.branches

    const x = Math.cos(branchAngle + spinAngle) * radius;
    const y = 0;
    const z = Math.sin(branchAngle + spinAngle) * radius;

    const x1 = x * Math.cos(rightTiltAngle) - y * Math.sin(rightTiltAngle);
    const y1 = x * Math.sin(rightTiltAngle) + y * Math.cos(rightTiltAngle);
    const z1 = z;

    // Apply forward tilt (around X axis)
    positions[i3] = x1;
    positions[i3 + 1] = y1 * Math.cos(forwardTiltAngle) - z1 * Math.sin(forwardTiltAngle);
    positions[i3 + 2] = y1 * Math.sin(forwardTiltAngle) + z1 * Math.cos(forwardTiltAngle);

    // Adjust randomness based on distance from center
    const randomnessFactor = Math.max(0.5, radius / parameters.radius);
    const randomX = Math.random() ** parameters.randomnessPower * randomnessFactor * (Math.random() < 0.5 ? -1 : 1);
    const randomY = Math.random() ** (parameters.randomnessPower * 9);
    const randomZ = Math.random() ** parameters.randomnessPower * randomnessFactor * (Math.random() < 0.5 ? -1 : 1);

    randomnessArray[i3] = randomX
    randomnessArray[i3 + 1] = randomY
    randomnessArray[i3 + 2] = randomZ

    const mixedColor = colorInside.clone()
    mixedColor.lerp(colorOutside, radius / parameters.radius)

    colors[i3 + 0] = mixedColor.r // R
    colors[i3 + 1] = mixedColor.g // G
    colors[i3 + 2] = mixedColor.b // B

    scales[i] = Math.random()
}

const shader = {
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    vertexColors: true,
    vertexShader,
    fragmentShader,
    uniforms: {
        uTime: { value: 0 },
        uSize: { value: parameters.size },
        uBlackHoleSize: { value: parameters.blackHoleSize },
        uSpeed: { value: parameters.speed },
        uEdgeColor: { value: new Color('#c4b5fd') },
        uDustColor: { value: new Color('#fda4af') },
        uRadius: { value: parameters.radius }
    },
}

const bufferRef = ref<{ [key: string]: any } | null>(null);

const elapsedTime = ref(0);
const pauseStartTime = ref(0);
const isPaused = ref(false);

const { pause, resume } = useRafFn(({ delta }) => {
    if (bufferRef.value) {
        if (!props.isGalaxyAnimationPaused) {
            if (isPaused.value) {
                isPaused.value = false;
                pauseStartTime.value = 0;
            }
            // Convert delta from milliseconds to seconds and add to elapsed time
            elapsedTime.value += delta * 0.001;
            bufferRef.value.material.uniforms.uTime.value = elapsedTime.value;
        } else {
            if (!isPaused.value) {
                isPaused.value = true;
                pauseStartTime.value = elapsedTime.value;
            }
            // Keep the time value frozen while paused
            bufferRef.value.material.uniforms.uTime.value = pauseStartTime.value;
        }
    }
})

onMounted(() => {
  resume()
})

onUnmounted(() => {
  pause()
})

// const labelColors = computed(() => ({
//     text: colorMode.value === 'dark' ? '#ffffff' : '#18181b',
//     star: colorMode.value === 'dark' ? parameters.insideColor : parameters.outsideColor
// }));

// function getStarPosition(index: number, total: number, yOffset: number = 0) {
//     const angle = (index / total) * Math.PI * 2;
//     const radius = parameters.radius * 0.7; // Slightly inside the galaxy's edge
    
//     // Apply the same tilts as the galaxy
//     const x = Math.cos(angle) * radius;
//     const y = yOffset;
//     const z = Math.sin(angle) * radius;

//     // Apply right tilt
//     const x1 = x * Math.cos(rightTiltAngle) - y * Math.sin(rightTiltAngle);
//     const y1 = x * Math.sin(rightTiltAngle) + y * Math.cos(rightTiltAngle);
//     const z1 = z;

//     // Apply forward tilt
//     return [
//         x1,
//         y1 * Math.cos(forwardTiltAngle) - z1 * Math.sin(forwardTiltAngle) + 0.3, // Add height offset
//         y1 * Math.sin(forwardTiltAngle) + z1 * Math.cos(forwardTiltAngle)
//     ];
// }

// function getStarSize(memberCount: number): number {
//     const baseSize = 0.05;
//     const sizeIncrease = 0.01;
//     return baseSize + (Math.min(memberCount, 10) * sizeIncrease);
// }

// onMounted(() => {
//     const getFamilies = async () => {
//         try {
//             const { data, error }: FetchTypeList<FamilyType> = await useFetch('/api/get-families-by-name', {
//                 method: 'GET',
//                 params: {
//                     table: 'families',
//                     select: '*',
//                     eq: 'last_name',
//                     familyName: '',
//                     limit: 6
//                 }
//             });

//             if (error) throw error;
//             if (!data || data.length === 0) return;

//             console.log(data);
//             trees.value = data;
//         } catch (err) {
//             console.error(err);
//         }
//     };
//     getFamilies();
// });
</script>

<template>
    <TresCanvas v-bind="gl.value">
        <TresPerspectiveCamera :position="[3.3, 0.8, 4.2]" />
        
        <TresPoints ref="bufferRef">
            <TresBufferGeometry
                :position="[positions, 3]"
                :a-scale="[scales, 1]"
                :color="[colors, 3]"
                :a-randomness="[randomnessArray, 3]"
            />
            <TresShaderMaterial v-bind="shader" />
        </TresPoints>

        <OrbitControls :enableZoom="false" :enablePan="false" :target="[2.1, 0, 0]" />
    </TresCanvas>
</template>