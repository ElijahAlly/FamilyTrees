import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

type BackgroundName = 'White' | 'Black' | 'Neutral' | 'Stone' | 'Amber' | 'Emerald' | 'Cyan' | 'Blue' | 'Zinc' | 'Fuchsia' | 'Rose';

type BackgroundColor = { 
    hex: string; 
    name: BackgroundName; 
}

type BackgroundPattern = 'no-background' | 'dot-background' | 'tree-background';

export const useDraggableZoneStore = defineStore('draggable-zone', () => {
    // * State
    const panzoomContentCenter = ref<boolean>(false);
    
    const showSidebar = ref<boolean>(true);
    const toggleSettings = ref<boolean>(false);
    const isFullPageDropdownOpen = ref<boolean>(false);

    // Patterns
    const availableBackgroundPatterns: BackgroundPattern[] = [
        'no-background',
        'dot-background',
        'tree-background',
    ];
    const curBackgroundPattern = ref<BackgroundPattern>('no-background');
    // const curBackgroundPattern = useStorage<string>('mft-curBackgroundPattern', 'no-background', undefined, { serializer: StorageSerializers.string });
    const showBackgroundPattern = computed(() => curBackgroundPattern.value !== 'no-background');
    const curDisplayType = ref('mdi:family-tree');

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
    
    const curBackgroundColor = ref<BackgroundColor>(availableBackgroundColors[0]);

    /**
    * * Uncomment to enable automatic background color change based on theme
    * Only changes if the current background color is white or black
    * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    
    const theme = useColorMode();

    const getBackgroundColorByHex = (hex: string): BackgroundColor => {
        return availableBackgroundColors.filter((color) => color.hex === hex)[0] as BackgroundColor;
    }
    
    const updateBackgroundColorBasedOnCurrentTheme = (newVal: "light" | "dark" | "auto" = theme.value) => {
        if (curBackgroundColor.value.hex === whiteHex || curBackgroundColor.value.hex === blackHex) {
            if (newVal === 'dark'){
                updateCurBackgroundColor(getBackgroundColorByHex(blackHex));
            } else {
                updateCurBackgroundColor(getBackgroundColorByHex(whiteHex));
            }
        }
    }
    
    onMounted(() => {
        updateBackgroundColorBasedOnCurrentTheme();
    })

    watch(theme, (newVal) => {
        updateBackgroundColorBasedOnCurrentTheme(newVal);
    }) 

    * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    */

    function updatePanzoomContentCenter(value?: boolean) {
        panzoomContentCenter.value = value ? value : !panzoomContentCenter.value;
    }

    function updateShowSidebar(value?: boolean) {
        showSidebar.value = value ? value : !showSidebar.value;
    }

    function updateCurBackgroundColor(color: BackgroundColor) {
        curBackgroundColor.value = color;
        return color;
    }

    function updateCurBackgroundPattern(value: BackgroundPattern) {
        curBackgroundPattern.value = value;
    }

    const getSecondaryColorByCurrentColor = computed<{ hex: string, tailwind: string }>(() =>{
        const _defaultDark = {
            hex: '#d1d5db',
            tailwind: 'gray-300',
        };

        const _defaultLight = {
            hex: '#ffffff',
            tailwind: 'neutral-600'
        };

        switch (curBackgroundColor.value.name) {
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
    });

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
        getSecondaryColorByCurrentColor,
        isFullPageDropdownOpen,
        updatePanzoomContentCenter,
        updateShowSidebar,
        updateCurBackgroundColor,
        updateCurBackgroundPattern,
    }
}, {
    persist: {
        key: 'draggable-zone',
        pick: [
            'isFullPageDropdownOpen',
            'curBackgroundPattern',
            'curBackgroundColor'
        ],
    }
})