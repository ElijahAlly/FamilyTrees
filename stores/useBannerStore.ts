import { defineStore } from 'pinia';

interface BannerState {
    title: string;
    description: string;
    isVisible: boolean;
}

export const useBannerStore = defineStore('banner', {
    state: (): BannerState => ({
        title: '',
        description: '',
        isVisible: false
    }),

    actions: {
        setBannerInfo(title: string, description: string) {
            this.title = title;
            this.description = description;
        },
        clearBannerInfo() {
            this.title = '';
            this.description = '';
        },
        show() {
            this.isVisible = true;
        },
        hide() {
            this.isVisible = false;
        }
    }
});
