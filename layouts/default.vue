<script lang="ts" setup>
import { Icon } from '@iconify/vue';
import { useBannerStore } from '@/stores/useBannerStore';
import { useRoute } from 'nuxt/app';
import { ref, computed, watch, onMounted, onBeforeMount } from 'vue';
import { useRouter } from 'nuxt/app';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style as StatusBarStyle } from '@capacitor/status-bar';
import Navbar from '@/components/navbar/index.vue';
import AppFooter from '@/components/AppFooter.vue';
import { listOfAllShortcuts, ShortcutSectionName, useHotkeys } from '../composables/useHotkeys';
import HotkeyHelperModal from '../components/HotkeyHelperModal.vue';
import UiToast from '@/components/ui/Toast.vue';
import ToastNotification from '@/components/ui/ToastNotification.vue';
import { storeToRefs } from 'pinia';

const { isNative, isMobile, platform } = useDevice();
const router = useRouter();
const route = useRoute();
const bannerStore = useBannerStore();
const authStore = useAuthStore();
const { isAuthenticated, profile } = storeToRefs(authStore);
const isOnTreePage = computed<boolean>(() => route.name === 'member-personId-tree-familyId');

const showHotkeyHelper = ref(false);
const isNavigatingBack = ref(false);
const showScrollBanner = ref(false);
const mainRef = ref<HTMLElement | null>(null);

router.beforeEach((to, from, next) => {
    isNavigatingBack.value = router.options.history.state.back === to.fullPath;
    next();
})

const showFooter = computed<boolean>(() => !isOnTreePage.value);

const showFloatingToolbar = computed<boolean>(() => {
    return isAuthenticated.value && !isOnTreePage.value;
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
    bannerStore.clearBannerInfo();
    if (isOnTreePage.value) {
        bannerStore.hide();
    } else {
        setTimeout(() => {
            scrollToTop();
        }, 420)
    }
}, { immediate: true });

const toggleShortcutHelperModal = () => showHotkeyHelper.value = !showHotkeyHelper.value;

const { registerHotkeys, showHotkeyHint, dismissHotkeyHint, notifyHotkeyAvailable, initHotkeyHintFromProfile } = useHotkeys(ShortcutSectionName.GLOBAL, {
    '?': { action: toggleShortcutHelperModal },
    't': {
        action: scrollToTop,
        condition: () => showScrollBanner.value
    }
});

// Initialize hotkey hint from user profile when it becomes available
watch(profile, (newProfile) => {
    if (newProfile?.preferences?.hotkeyHintDismissed) {
        initHotkeyHintFromProfile(true);
    }
}, { immediate: true });

onBeforeMount(() => {
    // Register all possible shortcuts with empty actions
    listOfAllShortcuts.forEach(({ name, hotkeys, activeOnPages, active }) => {
        registerHotkeys(name, hotkeys, activeOnPages, active);
    });
})

onMounted(() => {
    watch(isAuthenticated, async (newVal) => {
        if (newVal) {
            await authStore.getProfile();
        }
    }, { immediate: true })

    // Native app setup
    if (isNative) {
        // Handle Android back button
        CapApp.addListener('backButton', ({ canGoBack }) => {
            if (canGoBack) {
                router.back();
            } else {
                CapApp.exitApp();
            }
        });

        // Set status bar style
        StatusBar.setStyle({ style: StatusBarStyle.Light }).catch(() => {});
        if (platform === 'android') {
            StatusBar.setBackgroundColor({ color: '#8b5cf6' }).catch(() => {});
        }
    }
})
</script>

<template>
    <main
        ref="mainRef"
        class="relative w-screen h-screen overflow-x-hidden overflow-y-auto bg-zinc-300 dark:bg-zinc-900"
        :class="{ 'safe-area-padding': isNative }"
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
                    class="fixed top-0 left-0 right-0 pt-[9vh] backdrop-blur-md backdrop-brightness-100 dark:backdrop-brightness-50 z-40 border-b border-zinc-200 dark:border-zinc-700 py-2 px-4 flex justify-between items-center gap-2 shadow-lg text-zinc-950 dark:text-zinc-200 select-none"
                >
                    <div class="flex flex-col">
                        <span class="text-sm font-medium">{{ bannerStore.title }}</span>
                        <span class="text-xs text-zinc-600 dark:text-zinc-400">{{ bannerStore.description }}</span>
                    </div>
                    <button
                        @click="() => { scrollToTop(); notifyHotkeyAvailable(); }"
                        class="flex gap-1 items-center px-3 py-1 text-sm bg-zinc-800 hover:bg-zinc-900 text-white dark:bg-zinc-200 dark:hover:bg-zinc-50 dark:text-black rounded-lg transition-colors duration-200 justify-end"
                        title="Back to top of page (Shift+T)"
                    >
                        Scroll to top <Icon icon="mdi:arrow-up" class="h-4 w-4" />
                    </button>
                </div>
            </Transition>
            <div :class="['h-fit bg-neutral-50 dark:bg-neutral-950', {'min-h-screen': !isOnTreePage }, {'is-navigating-back': isNavigatingBack }]">
                <slot></slot>
            </div>
            <!-- <MemberFloatingToolbar v-if="showFloatingToolbar" /> -->
            <!-- Keyboard shortcuts UI — hidden on native and mobile (no physical keyboard) -->
            <template v-if="!isNative && !isMobile">
                <div
                    class="text-sm fixed right-9 bottom-6 p-2 dark:text-zinc-50 font-extralight rounded-md bg-zinc-200 dark:bg-zinc-900 border-[0.5px] border-zinc-800 dark:border-zinc-100 cursor-pointer"
                    title="View the Shortcuts Menu (Shift+?)"
                    @click="toggleShortcutHelperModal"
                >
                    Keyboard Shortcuts
                </div>
                <HotkeyHelperModal v-model:isOpen="showHotkeyHelper" />
                <UiToast
                    message="View Keyboard Shortcuts with Shift+?"
                    :visible="showHotkeyHint"
                    type="info"
                    :duration="6000"
                    action-label="Show"
                    :action-fn="() => { dismissHotkeyHint(); toggleShortcutHelperModal(); }"
                    @close="dismissHotkeyHint"
                />
            </template>
            <AppFooter v-if="showFooter"/>
            <ToastNotification />
        <!-- </AutoStyleWrapper> -->
    </main>
</template>

<style lang="postcss">
/* Safe area padding for native apps (notch, home indicator) */
.safe-area-padding {
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
    padding-left: env(safe-area-inset-left);
    padding-right: env(safe-area-inset-right);
}

/* Highlighting colors throughout the app */
::selection, ::-moz-selection {
    @apply bg-teal-300/90 text-zinc-950 dark:bg-zinc-50;
}

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