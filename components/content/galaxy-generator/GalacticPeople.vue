<script setup lang="ts">
import { defineAsyncComponent, type PropType } from 'vue';
import type { PersonType } from '@/types';

const Text = defineAsyncComponent(() => import('./Text.vue'));

const props = defineProps({
    isHoveringHero: { type: Boolean, required: true },
    isGalaxyAnimationPaused: { type: Boolean, required: true },
    showGalacticPeople: { type: Boolean, required: true },
    parameters: { type: Object as PropType<any>, required: true },
    elapsedTime: { type: Number, required: true },
});

const numOfPeopleToShow = ref<number>(6);
const curPersonIdx = ref<number>(0);
const galacticPeople = ref<PersonType[]>([]);
const peopleFromDb = ref<PersonType[]>([]);
const galacticPeopleLoading = ref<boolean>(false);
const galacticPeopleError = ref<any>(null);

// Position
const upDownPos = ref<{ [key: number]: { x: number, y: number, z: number } }>({});

// Speed
const personRotationSpeedInSec = ref<number>(1.5); // in seconds
let rotationInterval: ReturnType<typeof setInterval>;

const getGalacticPeople = async () => {
    galacticPeopleLoading.value = true;
    galacticPeopleError.value = null;

    try {
        const { data, error: fetchError } = await $fetch('/api/get-random-people', {
            method: 'GET',
            params: {
                count: numOfPeopleToShow.value * 2
            }
        }) as any;

        if (fetchError) throw fetchError;

        peopleFromDb.value = data;
        // console.log("\n== peopleFromDb.value ==\n", peopleFromDb.value, "\n");
    } catch (err: any) {
        galacticPeopleError.value = err;
        console.error('Failed to fetch random people:', err.message);
    } finally {
        galacticPeopleLoading.value = false;
    }
};

const rotateGalacticPeople = async () => {
    if (galacticPeople.value.length === 0) {
        galacticPeople.value = peopleFromDb.value.slice(0, numOfPeopleToShow.value);
    } else {
        galacticPeople.value[curPersonIdx.value] = peopleFromDb.value[numOfPeopleToShow.value + curPersonIdx.value];
        if (numOfPeopleToShow.value - 1 === curPersonIdx.value) {
            curPersonIdx.value = 0;
        } else {
            curPersonIdx.value = curPersonIdx.value + 1;
        }
    }
}

function getGalaxyPosition(index: number): [number, number, number] {
    const timeRotation = props.elapsedTime * props.parameters.speed;
    const baseAngle = (index / numOfPeopleToShow.value) * Math.PI * 2;
    const angle = baseAngle + timeRotation;

    const nameRadius = props.parameters.radius * 1.2;

    if (!upDownPos.value[index]) {
        upDownPos.value[index] = { 
            x: getRandomNumber(2, 4, 0), 
            y: getRandomNumber(0, 0.6, 2), 
            z: getRandomNumber(2, 4, 0) 
        };
    }

    return [
        (Math.cos(angle) * nameRadius) - upDownPos.value[index].x, // left/right
        upDownPos.value[index].y, // up/down
        (Math.sin(angle) * nameRadius) - upDownPos.value[index].z  // forward/back
    ];
}

watch(() => [props.showGalacticPeople, props.isGalaxyAnimationPaused], () => {
    if (!props.isGalaxyAnimationPaused && props.showGalacticPeople) {
        rotationInterval = setInterval(rotateGalacticPeople, personRotationSpeedInSec.value * 1000);
    } else {
        clearInterval(rotationInterval);
    }
});

onMounted(async () => {
    await getGalacticPeople();
    rotationInterval = setInterval(rotateGalacticPeople, personRotationSpeedInSec.value * 1000);
});

onBeforeUnmount(() => {
    clearInterval(rotationInterval);
});
</script>

<template>
    <TresGroup v-if="showGalacticPeople">
        <TresGroup :rotation="[-parameters.forwardTiltAngle, 0, -parameters.rightTiltAngle]">
            <Suspense>
                <Text v-for="(person, index) in galacticPeople" :key="`galaxy-${index}-${person.id}`" :person="person"
                    :position="getGalaxyPosition(index)" />
            </Suspense>
        </TresGroup>
    </TresGroup>
</template>