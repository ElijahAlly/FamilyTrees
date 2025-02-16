<script setup lang="ts">
import type { AutoStyleClass } from '@/types/auto-styles';
import { defineProps } from 'vue';
import { BasicShadowMap, SRGBColorSpace, NoToneMapping, Color, AdditiveBlending } from 'three'
import { vertexShader, fragmentShader } from './shaders'
import { useColorMode } from '@vueuse/core'
import type { FamilyType } from '@/types/family';
import { Text3D } from '@tresjs/cientos';

const autoStyleClass: AutoStyleClass = 'index-as';

const props = defineProps({ 
    isHoveringHero: { type: Boolean, default: false, required: true },
    isGalaxyAnimationPaused: { type: Boolean, default: false, required: true },
})

const trees = ref<FamilyType[]>([
    { id: 1, family_name: 'Anderson', members: [1,2,3] },
    { id: 2, family_name: 'Smith', members: [4,5] },
    { id: 3, family_name: 'Williams', members: [6,7,8,9] },
    { id: 4, family_name: 'Johnson', members: [10,11,12,13,14] },
    { id: 5, family_name: 'Brown', members: [15,16,17] },
    { id: 6, family_name: 'Davis', members: [18,19,20,21] },
    { id: 7, family_name: 'Miller', members: [22,23] },
    { id: 8, family_name: 'Wilson', members: [24,25,26,27,28] },
    { id: 9, family_name: 'Moore', members: [29,30,31] },
    { id: 10, family_name: 'Taylor', members: [32,33,34] },
    { id: 11, family_name: 'Thomas', members: [35,36,37,38] },
    { id: 12, family_name: 'Jackson', members: [39,40,41] },
    { id: 13, family_name: 'White', members: [42,43,44,45] },
    { id: 14, family_name: 'Harris', members: [46,47,48,49,50] },
    { id: 15, family_name: 'Martin', members: [51,52,53] }
]);

const colorMode = useColorMode()

function getRandomNumber(min: number, max: number, decimals: number = 2): number {
    return Number((Math.random() * (max - min) + min).toFixed(decimals));
}

const gl = computed(() => ({
    clearColor: colorMode.value === 'dark' ? '#0a0a0a' : '#fafafa',
    shadows: true,
    alpha: true,
    shadowMapType: BasicShadowMap,
    outputColorSpace: SRGBColorSpace,
    toneMapping: NoToneMapping,
})) as any

const radius = getRandomNumber(3, 4.2, 1);
const speed = 0.03 * Math.exp(4.2 - radius);
// const tilt = getRandomNumber(0.3, 0.8, 1);
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

const bufferRef = ref<any>(null)
const lastElapsedTime = ref(0);
const pauseStartTime = ref(0);
const totalPausedTime = ref(0);

const { onLoop } = useRenderLoop()

onLoop(({ elapsed }) => {
    if (bufferRef.value) {
        if (!props.isGalaxyAnimationPaused) {
            if (pauseStartTime.value > 0) {
                // Calculate how long we were paused
                totalPausedTime.value += elapsed - pauseStartTime.value;
                pauseStartTime.value = 0;
            }
            // Subtract the total paused time from elapsed to maintain continuity
            const adjustedTime = elapsed - totalPausedTime.value;
            lastElapsedTime.value = adjustedTime;
            bufferRef.value.material.uniforms.uTime.value = adjustedTime;
        } else {
            if (pauseStartTime.value === 0) {
                // Record when we started pausing
                pauseStartTime.value = elapsed;
            }
            // Keep the last time value when paused
            bufferRef.value.material.uniforms.uTime.value = lastElapsedTime.value;
        }
    }
})

// const textPositions = computed(() => {
//     const time = bufferRef.value?.material.uniforms.uTime.value || 0;
    
//     return trees.value.map((family, index) => {
//         const angleStep = (2 * Math.PI) / trees.value.length;
//         const baseAngle = index * angleStep;
//         const textRadius = parameters.radius * 0.7;
//         const rotationAngle = baseAngle + (time * parameters.speed);
        
//         // Calculate base position using galaxy's rotation
//         const x = Math.cos(rotationAngle) * textRadius;
//         const y = 0;
//         const z = Math.sin(rotationAngle) * textRadius;

//         // Apply tilts in same direction as galaxy
//         const x1 = x * Math.cos(rightTiltAngle) - y * Math.sin(rightTiltAngle);
//         const y1 = x * Math.sin(rightTiltAngle) + y * Math.cos(rightTiltAngle);
//         const z1 = z;

//         return {
//             position: [
//                 x1,
//                 y1 * Math.cos(forwardTiltAngle) - z1 * Math.sin(forwardTiltAngle),
//                 y1 * Math.sin(forwardTiltAngle) + z1 * Math.cos(forwardTiltAngle)
//             ] as [number, number, number],
//             text: family.family_name,
//             rotation: [
//                 forwardTiltAngle,     // Forward tilt
//                 rotationAngle,        // Rotation around galaxy
//                 rightTiltAngle        // Right tilt
//             ] as [number, number, number]
//         }
//     });
// });

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
    <TresCanvas v-bind="gl.value" :class="autoStyleClass">
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

        <!-- <Suspense>
            <template #default>
                <TresGroup 
                    v-for="(textData, i) in textPositions" 
                    :key="i" 
                    :position="textData.position"
                    :rotation="textData.rotation"
                >
                    <Text3D
                        :text="textData.text"
                        :size="0.1" 
                        :height="0.005" 
                        font="/fonts/helvetiker_regular.typeface.json"
                        :bevel-enabled="true"
                        :bevel-size="0.001"
                        :bevel-thickness="0.001"
                        :rotation="[0, Math.PI / 2, Math.PI / 2]"
                    >
                        <TresMeshStandardMaterial 
                            :color="colorMode === 'dark' ? '#ffffff' : '#000000'"
                            :metalness="0.3" 
                            :roughness="0.4"
                        />
                    </Text3D>
                </TresGroup>
            </template>
        </Suspense> -->

        <OrbitControls :enableZoom="false" :enablePan="false" :target="[2.1, 0, 0]" />
    </TresCanvas>
</template> 