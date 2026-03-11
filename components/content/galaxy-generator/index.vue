<script setup lang="ts">
import { watch, ref, onMounted, onBeforeUnmount } from 'vue';
import { useRafFn, useColorMode } from '@vueuse/core';
import { BasicShadowMap, SRGBColorSpace, NoToneMapping, Color, AdditiveBlending } from 'three';
import { vertexShader, fragmentShader } from './shaders';
import { Scene } from 'three/src/scenes/Scene.js';

const GalacticPeople = defineAsyncComponent(() => import('./GalacticPeople.vue'));

const scene = ref<Scene | null>(null);

const props = defineProps({
    isHoveringHero: { type: Boolean, default: false, required: true },
    isGalaxyAnimationPaused: { type: Boolean, default: false, required: true },
    showGalacticPeople: { type: Boolean, default: true, required: true },
});

const colorMode = useColorMode();

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
// const tilt = getRandomNumber(0.3, 0.8, 1);
const rightTiltAngle = getRandomNumber(0, 9, 1) * (Math.PI / 180); // Tilt to the right
const forwardTiltAngle = rightTiltAngle * 0.8; // Proportional forward tilt (0.8 can be adjusted)
const blackHoleSize = 0.3 + (radius / 4.2) * 0.4; // Will range from 0.3 to 0.7 based on radius

const parameters: any = {
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
    speed,
    rightTiltAngle,
    forwardTiltAngle,
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

    scales[i] = Math.random();
}

const shader: any = {
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
const elapsedTime = ref<number>(0);
const pauseStartTime = ref<number>(0);
const isPaused = ref<boolean>(false);

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
});

onMounted(() => {
    resume();
});

onBeforeUnmount(() => {
    pause();
});
</script>

<template>
    <TresCanvas v-bind="gl.value" @ready="({ scene: sceneObj }: any) => scene = sceneObj">
        <TresPerspectiveCamera :position="[3.3, 0.8, 4.2]" />

        <TresPoints ref="bufferRef">
            <TresBufferGeometry :position="[positions, 3]" :a-scale="[scales, 1]" :color="[colors, 3]"
                :a-randomness="[randomnessArray, 3]" />
            <TresShaderMaterial v-bind="shader" />
        </TresPoints>

        <Suspense>
            <GalacticPeople 
                :isHoveringHero="isHoveringHero" 
                :isGalaxyAnimationPaused="isGalaxyAnimationPaused"
                :showGalacticPeople="showGalacticPeople"
                :elapsedTime="elapsedTime"
                :parameters="parameters" 
            />
        </Suspense>

        <OrbitControls :enableZoom="false" :enablePan="false" :target="[2.1, 0, 0]" />
    </TresCanvas>
</template>