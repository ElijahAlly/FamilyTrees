<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { defineAsyncComponent, ref, shallowRef, watch } from 'vue';
import { useRouter } from 'nuxt/app'
import Button from '../ui/Button.vue';

const GalaxyGenerator = shallowRef<any>(undefined);
const GalaxyGeneratorComponent = defineAsyncComponent(() => import('../content/galaxy-generator/index.vue'));

const router = useRouter();
const { isMobile, isNative } = useDevice();
const isHoveringHero = ref<boolean>(false);
const isGalaxyAnimationPaused = ref<boolean>(false);
const showGalacticPeople = ref<boolean>(true);
const willRefreshGalaxy = ref<boolean>(false);

const startExploring = () => {
    router.push('/discover');
};

const refreshGalaxy = () => {
    if (willRefreshGalaxy.value) return;
    willRefreshGalaxy.value = true;
    
    setTimeout(async () => {
        GalaxyGenerator.value = undefined;
        GalaxyGenerator.value = GalaxyGeneratorComponent;
        willRefreshGalaxy.value = false;
    }, 900);
}

onMounted(() => {
    refreshGalaxy();
})

watch(isMobile, (newVal) => {
    if (newVal || isNative) {
        showGalacticPeople.value = false;
    } else {
        showGalacticPeople.value = true;
    }
})

// On native, disable galactic people by default for performance
if (isNative) {
    showGalacticPeople.value = false;
}
</script>

<template>
    <div class="relative h-[420px] w-full overflow-hidden bg-gradient-to-t from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 border-b border-zinc-200 dark:border-zinc-700"
        @mouseenter="!isNative && (isHoveringHero = true)" @mouseleave="!isNative && (isHoveringHero = false)"
        @touchstart="isNative && (isHoveringHero = true)" @touchend="isNative && (isHoveringHero = false)">
        <!-- Galaxy Background -->
        <div class="absolute inset-0 right-0 w-full h-full z-10">
            <Suspense>
                <Transition enter-active-class="animate-galaxy-enter" leave-active-class="animate-galaxy-leave"
                    enter-from-class="opacity-0 scale-0" enter-to-class="opacity-100 scale-100"
                    leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-0">
                    <div v-if="willRefreshGalaxy"></div>
                    <GalaxyGenerator v-else-if="GalaxyGenerator" :isHoveringHero="isHoveringHero"
                        :isGalaxyAnimationPaused="isGalaxyAnimationPaused" :showGalacticPeople="showGalacticPeople" />
                    <div v-else></div>
                </Transition>
            </Suspense>
        </div>

        <!-- Content -->
        <div class="relative h-full w-full flex items-center">
            <div class="ml-auto px-6 z-20 max-sm:w-4/5 max-md:w-1/2">
                <div
                    class="max-w-2xl backdrop-blur-sm bg-white/10 dark:bg-zinc-900/10 p-8 rounded-2xl transition-colors duration-150 ease-linear border border-zinc-200 dark:border-zinc-800 hover:border-y-zinc-700 dark:hover:border-y-zinc-500">
                    <h1 class="max-md:text-lg text-5xl font-bold text-zinc-800 dark:text-zinc-100">
                        Explore Your Family's Cosmic Legacy
                    </h1>
                    <p class="max-md:text-md text-xl text-zinc-600 dark:text-zinc-300 max-md:my-3 my-7">
                        Journey through the celestial map of your family history, where each star tells a story
                        {{ isMobile ? '.' : ' and every constellation connects generations.' }}
                    </p>
                    <Button @click="startExploring" size="fit" variant="submit">
                        Begin {{ isMobile ? '' : 'Your Journey' }}
                    </Button>
                </div>
            </div>
        </div>

        <!-- Pause Galaxy Animation -->
        <Button @click="isGalaxyAnimationPaused = !isGalaxyAnimationPaused" size="fit" variant="default"
            :disabled="willRefreshGalaxy" class="absolute ineset-0 left-[25px] bottom-6 z-30"
            :title="`${isGalaxyAnimationPaused ? 'Resume' : 'Pause'} Galaxy Animation`">
            <Icon v-if="isGalaxyAnimationPaused" icon="mdi:play" class="h-5 w-5" />
            <Icon v-else icon="material-symbols:pause" class="h-5 w-5" />
        </Button>

        <!-- Refresh Galaxy (Get's a new one) -->
        <Button v-if="!isMobile" @click="!!GalaxyGenerator && refreshGalaxy()" size="fit" variant="default"
            :disabled="willRefreshGalaxy" class="absolute ineset-0 left-[100px] bottom-6 z-30"
            title="Refresh to get a new Galaxy, and a new set of random people.">
            <Icon icon="garden:reload-stroke-12" :class="['h-5 w-5', { 'animate-spin': willRefreshGalaxy }]" />
        </Button>

        <!-- Show/Hide People on Galaxy -->
        <Button v-if="!isMobile" @click="showGalacticPeople = !showGalacticPeople" size="fit" variant="default"
            :disabled="willRefreshGalaxy" class="absolute ineset-0 left-[175px] bottom-6 z-30"
            :title="`${showGalacticPeople ? 'Hide' : 'Show'} random people in Galaxy`">
            <Icon v-if="showGalacticPeople" icon="mingcute:user-visible-fill" class="h-5 w-5" />
            <Icon v-else icon="mingcute:user-hide-fill" class="h-5 w-5" />
        </Button>

        <!-- Decorative Elements -->
        <div
            class="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-zinc-50 from-0% via-zinc-50/50 via-30% to-transparent to-100% dark:from-zinc-900 dark:via-zinc-900/50">
        </div>
    </div>
</template>

<style>
.animate-galaxy-enter {
    animation: galaxy-enter 1.2s ease-in-out;
}

.animate-galaxy-leave {
    animation: galaxy-leave 1.2s ease-in-out;
}

@keyframes galaxy-enter {
    0% {
        opacity: 0;
        transform: scale(0);
    }

    100% {
        opacity: 1;
        transform: scale(1);
    }
}

@keyframes galaxy-leave {
    0% {
        opacity: 1;
        transform: scale(1);
    }

    100% {
        opacity: 0;
        transform: scale(0);
    }
}
</style>