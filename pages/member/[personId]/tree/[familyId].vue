<script lang="ts">
import { Icon } from '@iconify/vue';
import { useFamilyStore } from '@/stores/useFamily';
import { useDraggableZoneStore } from '@/stores/useDraggableZone';
import * as PanzoomModule from '@panzoom/panzoom';
const Panzoom = PanzoomModule.default;
import { type PanzoomObject } from '@panzoom/panzoom'; 
import { useWatchFamilyStore } from '@/composables/useWatchFamilyStore';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import FamilyTree from '@/components/family/FamilyTree.vue';
import DraggableSection from '@/components/family/DraggableSection.vue';
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue';
import FamilyDetailsDropdown from '@/components/family/FamilyDetailsDropdown.vue';
import FamilyDetails from '@/components/family/FamilyDetails.vue';
import { useRoute } from 'nuxt/app';
import { ShortcutSectionName, useHotkeys } from '@/composables/useHotkeys';
import type { FamilyTreeNodeType } from '@/types';

export default {
    setup() {
        useWatchFamilyStore();

        const familyStore = useFamilyStore();
        const { currentFamilyTree, loadingFamily } = storeToRefs(familyStore);
        const route = useRoute();

        const draggableZoneStore = useDraggableZoneStore();
        const { curDisplayType } = storeToRefs(draggableZoneStore);
        const { setHotkeysActions, unregisterHotkeys } = useHotkeys();

        const maxScale = ref(3.6);
        const minScale = ref(0.3);
        const currentZoomPercent = ref(1);
        const sliderValue = ref([1, maxScale.value]);
        const stepValue = ref(0.03);

        let panzoom: PanzoomObject | undefined;

        const isMountedAndTriedToFetchFamilyTree = ref(false);

        return {
            isMountedAndTriedToFetchFamilyTree,
            loadingFamily,
            panzoom,
            familyStore,
            draggableZoneStore,
            currentFamilyTree,
            sliderValue,
            stepValue,
            minScale,
            maxScale,
            currentZoomPercent,
            curDisplayType,
            route,
            setHotkeysActions,
            unregisterHotkeys,
            ShortcutSectionName
        }
    },
    components: {
        FamilyTree,
        DraggableSection,
        LoadingSpinner,
        FamilyDetailsDropdown,
        FamilyDetails
    },
    mounted() {
        this.isMountedAndTriedToFetchFamilyTree = true;

        const element: HTMLElement = this.$refs.treeContainer as HTMLElement;
        if (!element || !element.parentElement) return;

        this.panzoom = Panzoom(element, {
            minScale: this.minScale,
            maxScale: this.maxScale,
            step: this.stepValue, // Controls the zoom speed. Larger number === faster zoom
            startScale: 1,
            startX: 0,
            startY: 0,
            isSVG: true,
            relative: false,
            // Center the content initially
            // setTransform: (elem: any, { scale, x, y }: any) => {
            //   // Center the initial position
            //   console.log("\n== scale ==\n", scale, "\n");
            //   console.log("\n== x ==\n", x, "\n");
            //   console.log("\n== y ==\n", y, "\n");
            //   if (x === 0 && y === 0) {
            //     const rect = elem.getBoundingClientRect();
            //     const centerX = (9999 - rect.width) / 2;
            //     const centerY = (9999 - rect.height) / 2;
            //     elem.style.transform = `translate(${centerX}px, ${centerY}px) scale(${scale})`;
            //   } else {
            //     elem.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
            //   }
            // }
        });

        element.addEventListener('panzoomchange', (e) => {
            if (!this.panzoom) return;
            // console.log(this.panzoom.getPan());
            // console.log(this.panzoom.getScale());
            const scale = this.panzoom.getScale();
            this.sliderValue[0] = scale;  // Update the first element in the sliderValue array with the new scale
            this.currentZoomPercent = scale / this.maxScale;
        });

        element.parentElement.addEventListener('wheel', (event: any) => {
            if (!this.panzoom) return;

            const currentScale = this.panzoom.getScale();
            let scale;

            if (event.deltaY < 0) {
                // Zoom in on mouse/touchpad scroll
                scale = Math.min(currentScale * (1 + this.stepValue), this.maxScale);
            } else {
                // Zoom out on mouse/touchpad scroll
                scale = Math.max(currentScale * (1 - this.stepValue), this.minScale);
            }

            const point = {
                clientX: event.clientX,
                clientY: event.clientY,
            }

            this.panzoom.zoomToPoint(scale, point);
            event.preventDefault();
        }, { passive: false });

        this.setHotkeyCapabilities();
    },
    onBeforeUnmount() {
        this.isMountedAndTriedToFetchFamilyTree = true;
        this.unregisterHotkeys(ShortcutSectionName.FAMILY_TREE_PAGE);
    },
    beforeRouteLeave(_to: any, _from: any, next: any) {
        this.unregisterHotkeys(ShortcutSectionName.FAMILY_TREE_PAGE);
        next();
    },
    methods: {
        handleToggleFamilyDetails(isVisible: boolean) {
            if (isVisible) {
                this.unregisterHotkeys(ShortcutSectionName.FAMILY_TREE_PAGE);
                return;
            }
            this.setHotkeyCapabilities();
        },
        setHotkeyCapabilities() {
            this.setHotkeysActions(ShortcutSectionName.FAMILY_TREE_PAGE, {
                'r': { action: this.resetZoomAndPan },
                '_': { action: this.zoomOut },
                '+': { action: this.zoomIn },
                'a': { action: this.panLeft },
                'd': { action: this.panRight },
                'w': { action: this.panUp },
                's': { action: this.panDown }
            })
        },
        handleSliderDrag(payload: number[] | undefined) {
            if (!this.panzoom || !payload || !payload[0]) return;
            this.panzoom.zoom(payload[0])
            this.currentZoomPercent = payload[0] / this.maxScale;
        },
        zoomIn() {
            if (!this.panzoom) return;

            const currentScale = this.panzoom.getScale();
            const newScale = Math.min(currentScale * (1 + (this.stepValue * 2)), this.maxScale);

            this.panzoom.zoom(newScale, {
                animate: true,
                duration: 300,
                easing: 'ease-in-out'
            });

            // Update slider and zoom percentage
            this.sliderValue[0] = newScale;
            this.currentZoomPercent = newScale / this.maxScale;
        },
        zoomOut() {
            if (!this.panzoom) return;

            const currentScale = this.panzoom.getScale();
            const newScale = Math.max(currentScale * (1 - (this.stepValue * 2)), this.minScale);

            this.panzoom.zoom(newScale, {
                animate: true,
                duration: 300,
                easing: 'ease-in-out'
            });

            // Update slider and zoom percentage
            this.sliderValue[0] = newScale;
            this.currentZoomPercent = newScale / this.maxScale;
        },
        resetZoomAndPan() {
            if (!this.panzoom) return;

            // Reset panzoom with animation
            this.panzoom.reset({
                animate: true,
                duration: 300,
                easing: 'ease-in-out'
            });

            // Reset the slider and zoom percentage
            const scale = this.panzoom.getScale();
            this.sliderValue[0] = scale;
            this.currentZoomPercent = scale / this.maxScale;
        },
        panLeft() {
            if (!this.panzoom) return;
            const currentX = this.panzoom.getPan().x;
            this.panzoom.pan(currentX + 50, this.panzoom.getPan().y, {
                animate: true,
                duration: 150,
                easing: 'ease-out'
            });
        },
        panRight() {
            if (!this.panzoom) return;
            const currentX = this.panzoom.getPan().x;
            this.panzoom.pan(currentX - 50, this.panzoom.getPan().y, {
                animate: true,
                duration: 150,
                easing: 'ease-out'
            });
        },
        panUp() {
            if (!this.panzoom) return;
            const currentY = this.panzoom.getPan().y;
            this.panzoom.pan(this.panzoom.getPan().x, currentY + 50, {
                animate: true,
                duration: 150,
                easing: 'ease-out'
            });
        },
        panDown() {
            if (!this.panzoom) return;
            const currentY = this.panzoom.getPan().y;
            this.panzoom.pan(this.panzoom.getPan().x, currentY - 50, {
                animate: true,
                duration: 150,
                easing: 'ease-out'
            });
        },
        centerOnNode({ x, y }: { x: number, y: number }) {
            if (!this.panzoom || !window) return;

            this.resetZoomAndPan();

            // Get the container dimensions
            const container = this.$refs.treeContainer as HTMLElement;
            if (!container || !container.parentElement) return;

            const containerRect = container.parentElement.getBoundingClientRect();

            // Calculate the center point of the container
            const centerX = containerRect.width / 2;
            const centerY = containerRect.height / 2;

            // The multiplier for the x position to center the node (move it to the left some)
            let xMultiplier = window.innerWidth / 3;

            // Calculate the required pan to center the node
            const scale = this.panzoom.getScale();
            const panX = centerX - ((x + xMultiplier) * scale);
            const panY = centerY - (y * scale);

            // Pan to center the node
            this.panzoom.pan(panX, panY, {
                animate: true,
                duration: 300, // milliseconds
                easing: 'ease-in-out'
            });
        }
    }
};
</script>

<template>
    <div class="relative min-h-[92vh] max-h-[92vh] w-full overflow-hidden">
        <FamilyDetailsDropdown v-show="currentFamilyTree" title="Family Details"
            @toggle:familyDetails="handleToggleFamilyDetails">
            <template #content>
                <FamilyDetails />
            </template>
        </FamilyDetailsDropdown>
        <DraggableSection v-show="currentFamilyTree && !loadingFamily">
            <div ref="treeContainer">
                <FamilyTree v-if="curDisplayType === 'mdi:family-tree'" @centerNode="centerOnNode" />
                <!-- <FamilySunburstChart />  -->
            </div>
        </DraggableSection>

        <!-- SliderRange for zoom -->
        <div v-if="currentFamilyTree && !loadingFamily"
            class="flex flex-col items-center absolute bottom-[51px] left-[0px] translate-x-[30px] bg-white dark:bg-black border hover:border-zinc-300 dark:border-zinc-600 dark:hover:border-zinc-100 rounded p-2">
            <Icon name="iconamoon:zoom-in-duotone" @click.stop="zoomIn"
                class="h-5 w-5 text-black dark:text-white cursor-pointer" />
            <ui-slider-root v-model="sliderValue"
                class="relative flex items-center justify-center select-none touch-none h-[200px] w-3 my-3"
                :min="minScale" :max="maxScale" :step="stepValue" :minStepsBetweenThumbs="stepValue - 1"
                @update:modelValue="handleSliderDrag" orientation="vertical">
                <ui-slider-track class="relative grow rounded-full h-full bg-zinc-300 dark:bg-zinc-800"
                    style="max-width: 9px;">
                    <ui-slider-range class="absolute rounded-full h-full" />
                </ui-slider-track>
                <ui-slider-thumb
                    class="block w-5 h-5 bg-zinc-950 dark:bg-zinc-300 hover:bg-zinc-900 dark:hover:bg-zinc-200 shadow-none focus:shadow-none rounded-full outline-none cursor-ns-resize"
                    aria-label="Volume" :title="`${(currentZoomPercent * 100).toFixed(2)}%`" />
            </ui-slider-root>
            <Icon name="iconamoon:zoom-out-duotone" @click.stop="zoomOut"
                class="h-5 w-5 text-black dark:text-white cursor-pointer" />
        </div>
        <div v-if="currentFamilyTree && !loadingFamily"
            class="flex items-center absolute bottom-[12px] left-[0px] translate-x-[30px] bg-white dark:bg-black border hover:border-zinc-300 dark:border-zinc-600 dark:hover:border-zinc-100 rounded py-1 px-2 cursor-pointer"
            @click.stop="resetZoomAndPan" title="Reset Zoom & Pan to original view (Shift+R)">
            <Icon name="carbon:zoom-reset" class="h-5 w-5 text-black dark:text-white" />
        </div>

        <!-- Error Loading tree -->
        <div v-else-if="isMountedAndTriedToFetchFamilyTree && !loadingFamily && !currentFamilyTree"
            class="absolute inset-0 w-full h-full flex flex-col items-center">
            <p class="text-red-500 dark:text-red-500 font-medium text-lg mt-80">
                Error loading the family tree! Please refresh or go back to
                <NuxtLink :to="{ name: 'member-personId', params: { personId: route.params.personId }}"
                    class="underline font-normal text-zinc-700 dark:text-zinc-300">
                    <span>Your Profile</span>
                </NuxtLink>
                and try again.
            </p>
        </div>

        <!-- Loading tree -->
        <div v-else class="absolute inset-0 w-full h-full flex flex-col items-center justify-center">
            <LoadingSpinner />
            <p class="text-black dark:text-white mt-3 font-extralight text-sm">Loading the{{ ` ${route.params.familyName
                ||
                ''} ` }}family tree...</p>
        </div>
    </div>
</template>