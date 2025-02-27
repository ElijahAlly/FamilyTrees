<script lang="ts" setup>
import { Icon } from '@iconify/vue';
import { useBannerStore } from '@/stores/useBannerStore';
import { useRoute } from 'nuxt/app';
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { useRouter } from 'nuxt/app';
import { useColorMode } from '@vueuse/core';
import Navbar from '@/components/navbar/index.vue';
import AppFooter from '@/components/AppFooter.vue';

const router = useRouter();
const route = useRoute();
const bannerStore = useBannerStore();
const colorMode = useColorMode();

const isNavigatingBack = ref(false);
const showScrollBanner = ref(false);
const mainRef = ref<HTMLElement | null>(null);

router.beforeEach((to, from, next) => {
    isNavigatingBack.value = router.options.history.state.back === to.fullPath;
    next();
})

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
    if (route.name === 'familyName-member-personId') {
        bannerStore.setBannerInfo(
            'Person Details',
            `Viewing details for person ${route.params.personId} in family ${route.params.familyName}`
        );
    } 
    // Can't remember why this is here
    // else if (route.path.includes('member')) {
    //     bannerStore.setBannerInfo(
    //         'Member Area',
    //         'Manage your family tree and personal settings'
    //     );
    // } 
    else {
        bannerStore.clearBannerInfo();
    }

    if (route.name !== 'familyName-familyId') {
        setTimeout(() => {
            scrollToTop();
        }, 420)
    } else {
        bannerStore.hide();
    }
}, { immediate: true });

watch(colorMode, (newVal) => {
    if (newVal === 'dark') {
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
        @scroll="handleScroll"
    >
        <!-- <AutoStyleWrapper> -->
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
                    class="fixed top-0 left-0 right-0 pt-[9vh] backdrop-blur-md backdrop-brightness-100 dark:backdrop-brightness-50 z-30 border-b border-zinc-200 dark:border-zinc-700 py-2 px-4 flex justify-between items-center gap-2 shadow-lg text-zinc-950 dark:text-zinc-200 select-none"
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
            <div :class="[
                `h-fit ${!$route.params?.familyName && !$route.params?.familyId ? 'min-h-screen' : ''} bg-neutral-50 dark:bg-neutral-950`,
                isNavigatingBack ? 'is-navigating-back' : ''
            ]">
                <slot></slot>
            </div>
            <AppFooter v-if="showFooter"/>
        <!-- </AutoStyleWrapper> -->
    </main>
</template>

<!-- ::selection {
  @apply bg-violet-600 text-white dark:bg-violet-300 dark:text-black;
}

::-moz-selection {
  @apply bg-violet-600 text-white dark:bg-white dark:text-black;
} -->

<style>
/* Layout transition */
.layout-enter-active,
.layout-leave-active {
  transition: all 0.24s ease-in-out;
}

.layout-enter-from,
.layout-leave-to {
  opacity: 0;
  filter: blur(1rem);
}

/* Page transition */
.page-enter-active,
.page-leave-active {
  transition: all 0.24s ease-in-out;
}

/* Forward navigation */
.page-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.page-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* Backward navigation (Only applies if going back to a page that was just visited. Otherwise, it will use the forward navigation animation ) */
.is-navigating-back .page-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.is-navigating-back .page-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>