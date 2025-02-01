import { defineStore } from 'pinia';
import { ref } from 'vue';

type BackgroundName = 'White' | 'Black' | 'Neutral' | 'Stone' | 'Amber' | 'Emerald' | 'Cyan' | 'Blue' | 'Zinc' | 'Fuchsia' | 'Rose';

type BackgroundColor = { 
    hex: string; 
    name: BackgroundName; 
}

export const useDraggableZoneStore = defineStore('draggable-zone', {
    state: () => {
        const panzoomContentCenter = ref(false);
        
        const showSidebar = ref(true);
        const toggleSettings = ref(false);

        // Patterns
        const availableBackgroundPatterns = [
            'no-background',
            'dot-background',
            'tree-background',
        ];
        const curBackgroundPattern = ref('no-background');
        const showBackgroundPattern = computed(() => curBackgroundPattern.value !== 'no-background');

        // Colors
        const whiteHex: '#ffffff' = '#ffffff';
        const blackHex: '#000000' = '#000000';
        const neutralHex: '#0f172a' = '#0f172a';
        const stoneHex: '#1c1917' = '#1c1917';
        const amberHex: '#78350f' = '#78350f';
        const emeraldHex: '#064e3b' = '#064e3b';
        const cyanHex: '#164e63' = '#164e63';
        const blueHex: '#1e3a8a' = '#1e3a8a';
        const zincHex: '#4c1d95' = '#4c1d95';
        const fuchsiaHex: '#701a75' = '#701a75';
        const roseHex: '#881337' = '#881337';
        const availableBackgroundColors: BackgroundColor[] = [
            { hex: whiteHex, name: 'White'},
            { hex: blackHex, name: 'Black'},
            { hex: neutralHex, name: 'Neutral'},
            { hex: stoneHex, name: 'Stone'},
            { hex: amberHex, name: 'Amber'},
            { hex: emeraldHex, name: 'Emerald'},
            { hex: cyanHex, name: 'Cyan'},
            { hex: blueHex, name: 'Blue'},
            { hex: zincHex, name: 'Zinc'},
            { hex: fuchsiaHex, name: 'Fuchsia'},
            { hex: roseHex, name: 'Rose'},
        ];
        const getBackgroundColorByHex = (hex: string): BackgroundColor => {
            return availableBackgroundColors.filter((color) => color.hex === hex)[0] as BackgroundColor;
        }
        const theme = useColorMode();
        const curBackgroundColor = ref<BackgroundColor>(availableBackgroundColors[0]);
        curBackgroundColor.value = theme.value === 'dark' ? getBackgroundColorByHex(blackHex) : getBackgroundColorByHex(whiteHex)

        watch(theme, (newValue) => {
            if (curBackgroundColor.value.hex === whiteHex || curBackgroundColor.value.hex === blackHex) {
                curBackgroundColor.value.hex = newValue ? blackHex : whiteHex;
            }
        })

        // Display type
        const curDisplayType = ref('mdi:family-tree');

        return {
            panzoomContentCenter,
            toggleSettings,
            curBackgroundPattern,
            showBackgroundPattern,
            curBackgroundColor,
            showSidebar,
            curDisplayType,
            availableBackgroundColors,
            availableBackgroundPatterns,
        }
    },
    actions: {
        updatePanzoomContentCenter(value?: boolean) {
            this.panzoomContentCenter = value ? value : !this.panzoomContentCenter;
        },
        updateShowSidebar(value?: boolean) {
            this.showSidebar = value ? value : !this.showSidebar;
        },
        updateCurBackgroundColor(color: BackgroundColor) {
            this.curBackgroundColor = color;
        },
        updateCurBackgroundPattern(value: string) {
            this.curBackgroundPattern = value;
        },
    },
    getters: {
        getSecondaryColorByCurrentColor(): { hex: string, tailwind: string } {
            const _defaultDark = {
                hex: '#d1d5db',
                tailwind: 'gray-300',
            };

            const _defaultLight= {
                hex: '#ffffff',
                tailwind: 'neutral-600'
            };

            switch (this.curBackgroundColor.name) {
                case 'Amber':
                    return _defaultDark;

                case 'Black':
                    return _defaultLight;

                case 'Blue':
                    return _defaultDark;

                case 'Cyan':
                    return _defaultDark;

                case 'Emerald':
                    return _defaultDark;

                case 'Fuchsia':
                    return _defaultDark;

                case 'Rose':
                    return _defaultDark;

                case 'Neutral':
                    return _defaultDark;

                case 'Stone':
                    return _defaultDark;

                case 'Zinc':
                    return _defaultDark;

                case 'White':
                    return _defaultDark;
            
                default:
                    return _defaultDark;
            }
        }
    },
    persist: true
})