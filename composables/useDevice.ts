export const useDevice = () => {
    const isMobileRef = ref(false);
    const isMobile = computed(() => isMobileRef.value);
  
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
    };
};
  