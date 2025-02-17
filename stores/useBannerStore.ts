import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useBannerStore = defineStore('banner', () => {
    const title = ref('');
    const description = ref('');
    const isVisible = ref(false);

    function setBannerInfo(newTitle: string, newDescription: string) {
        title.value = newTitle;
        description.value = newDescription;
    }

    function clearBannerInfo() {
        title.value = '';
        description.value = '';
    }

    function show() {
        isVisible.value = true;
    }

    function hide() {
        isVisible.value = false;
    }

    return {
        title,
        description,
        isVisible,
        setBannerInfo,
        clearBannerInfo,
        show,
        hide
    }
});