<script lang="ts" setup>
import type { AutoStyleClass } from '@/types/auto-styles';
import { Icon } from '@iconify/vue';
import { useBannerStore } from '@/stores/useBannerStore';

const route = useRoute();
const bannerStore = useBannerStore();

const autoStyleClass: AutoStyleClass = 'default-as';
const colorMode = useColorMode()

const showScrollBanner = ref(false);
const mainRef = ref<HTMLElement | null>(null);

const showFooter = computed(() => {
    const doesNotHaveFamilyName = !route.params?.familyName;
    // const hasFamilyId = !!route.params?.familyId;
    const isMemberPage = route.fullPath.includes('member');
    return doesNotHaveFamilyName || isMemberPage;
})

const scrollToTop = () => {
    mainRef.value?.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
};

const handleScroll = (event: Event) => {
    const target = event.target as HTMLElement;
    if (!showFooter.value) return;
    
    // Show banner after scrolling down 150px
    showScrollBanner.value = target.scrollTop > 150;
    if (showScrollBanner.value) {
        bannerStore.show();
    } else {
        bannerStore.hide();
    }
};

watch(() => route.path, () => {
    if (route.params.familyName && route.params.personId) {
        bannerStore.setBannerInfo(
            'Person Details',
            `Viewing details for person ${route.params.personId} in family ${route.params.familyName}`
        );
    } else if (route.path.includes('member')) {
        bannerStore.setBannerInfo(
            'Member Area',
            'Manage your family tree and personal settings'
        );
    } else {
        bannerStore.clearBannerInfo();
    }
}, { immediate: true });

watch(colorMode, (newVal) => {
    if (newVal.value === 'dark') {
        document.documentElement.style.backgroundColor = '#18181b';
    } else {
        document.documentElement.style.backgroundColor = '#d4d4d8';
    }
})

onMounted(() => {
    if (colorMode.value === 'dark') {
        document.documentElement.style.backgroundColor = '#18181b';
    } else {
        document.documentElement.style.backgroundColor = '#d4d4d8'; 
    }
})
</script>

<template>
    <main 
        ref="mainRef"
        class="relative w-screen h-screen overflow-x-hidden overflow-y-auto bg-neutral-50 dark:bg-neutral-950" 
        :class="autoStyleClass"
        @scroll="handleScroll"
    >
        <AutoStyleWrapper>
            <Navbar />
            <Transition
                enter-active-class="transition duration-300 ease-out"
                enter-from-class="transform -translate-y-full opacity-0"
                enter-to-class="transform translate-y-0 opacity-100"
                leave-active-class="transition duration-200 ease-in"
                leave-from-class="transform translate-y-0 opacity-100"
                leave-to-class="transform -translate-y-full opacity-0"
            >
                <div
                    v-if="showScrollBanner && bannerStore.isVisible"
                    class="fixed top-0 left-0 right-0 pt-[13vh] backdrop-blur-md backdrop-brightness-100 dark:backdrop-brightness-50 z-30 border-b border-zinc-200 dark:border-zinc-700 py-2 px-4 flex justify-between items-center gap-2 shadow-lg text-zinc-950 dark:text-zinc-200 select-none"
                >
                    <div class="flex flex-col">
                        <span class="text-sm font-medium">{{ bannerStore.title }}</span>
                        <span class="text-xs text-zinc-600 dark:text-zinc-400">{{ bannerStore.description }}</span>
                    </div>
                    <button
                        @click="scrollToTop"
                        class="px-3 py-1 text-sm bg-zinc-800 hover:bg-zinc-900 text-white dark:bg-zinc-200 dark:hover:bg-zinc-50 dark:text-black rounded-lg transition-colors duration-200 justify-end"
                    >
                        Scroll to top <Icon icon="mdi:arrow-up" class="inline-block" />
                    </button>
                </div>
            </Transition>
            <div :class="`h-fit ${!$route.params?.familyName && !$route.params?.familyId ? 'min-h-screen' : ''} bg-neutral-50 dark:bg-neutral-950`">
                <slot></slot>
            </div>
            <AppFooter v-if="showFooter"/>
        </AutoStyleWrapper>
    </main>
</template>

<style lang="postcss">
::selection {
  @apply bg-violet-600 text-white dark:bg-violet-300 dark:text-black;
}

::-moz-selection {
  @apply bg-violet-600 text-white dark:bg-white dark:text-black;
}
</style>