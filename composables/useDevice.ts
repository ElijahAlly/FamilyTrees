import { Capacitor } from '@capacitor/core';

export const useDevice = () => {
    const isMobileRef = ref(false);
    const isMobile = computed(() => isMobileRef.value);

    const isNative = Capacitor.isNativePlatform();
    const platform = Capacitor.getPlatform() as 'ios' | 'android' | 'web';

    const checkDevice = () => {
        isMobileRef.value = window.innerWidth <= 768;
    };

    onMounted(() => {
        checkDevice();
        window.addEventListener('resize', checkDevice);
    });

    onUnmounted(() => {
        window.removeEventListener('resize', checkDevice);
    });

    return {
        isMobile,
        isNative,
        platform,
    };
};
  