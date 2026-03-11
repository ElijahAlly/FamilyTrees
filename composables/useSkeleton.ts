const SKELETON_CLASSES = 'bg-zinc-200 dark:bg-zinc-700 rounded-md border shadow-md animate-pulse' as const;

export const useSkeleton = (isLoading: Ref<boolean>) => {
    const skeletonClasses = computed(() => ({
        [SKELETON_CLASSES]: isLoading.value
    }));
  
    return {
        skeletonClasses,
    };
};