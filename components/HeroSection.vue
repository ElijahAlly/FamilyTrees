<script setup lang="ts">
import { Icon } from '@iconify/vue'
import GalaxyGenerator from './content/galaxy-generator/index.vue';

const router = useRouter();
const isHoveringHero = ref(false);
const isGalaxyAnimationPaused = ref(false);

const startExploring = () => {
    router.push('/discover');
};
</script>

<template>
    <div 
        class="relative h-[420px] w-full overflow-hidden bg-gradient-to-t from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 border-b border-zinc-200 dark:border-zinc-700"
        @mouseenter="isHoveringHero = true"
        @mouseleave="isHoveringHero = false"
    >
        <!-- Galaxy Background -->
        <div class="absolute inset-0 right-0 w-full h-full">
            <GalaxyGenerator :isHoveringHero="isHoveringHero" :isGalaxyAnimationPaused="isGalaxyAnimationPaused" />
        </div>

        <!-- Content -->
        <div class="relative z-10 h-full w-full flex items-center">
            <div class="ml-auto px-6">
                <div class="max-w-2xl backdrop-blur-sm bg-white/10 dark:bg-zinc-900/10 p-8 rounded-2xl transition-colors duration-150 ease-linear border border-zinc-200 dark:border-zinc-800 hover:border-y-zinc-700 dark:hover:border-y-zinc-500">
                    <h1 class="text-5xl font-bold text-zinc-800 dark:text-zinc-100 mb-6">
                        Explore Your Family's Cosmic Legacy
                    </h1>
                    <p class="text-xl text-zinc-600 dark:text-zinc-300 mb-8">
                        Journey through the celestial map of your family history, where each star tells a story and every constellation connects generations.
                    </p>
                    <ui-button @click="startExploring" size="fit" variant="submit">
                        Begin Your Journey
                    </ui-button>
                </div>
            </div>
        </div>

        <!-- Pause Galaxy Animation -->
        <ui-button
            @click="isGalaxyAnimationPaused = !isGalaxyAnimationPaused" 
            size="fit"
            variant="default"
            class="absolute ineset-0 left-6 bottom-6 z-30"
            :title="`${isGalaxyAnimationPaused ? 'Resume' : 'Pause'} Galaxy Animation`"
        >
            <Icon v-if="isGalaxyAnimationPaused" icon="mdi:play" class="h-5 w-5" /> 
            <Icon v-else icon="material-symbols:pause" class="h-5 w-5" /> 
        </ui-button>

        <!-- Decorative Elements -->
        <div class="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-zinc-50 from-0% via-zinc-50/50 via-30% to-transparent to-100% dark:from-zinc-900 dark:via-zinc-900/50"></div>
    </div>
</template>
