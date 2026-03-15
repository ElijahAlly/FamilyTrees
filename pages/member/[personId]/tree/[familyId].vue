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
import AddPersonToTree from '@/components/family/AddPersonToTree.vue';
import FindPersonPanel from '@/components/family/FindPersonPanel.vue';
import UiToast from '@/components/ui/Toast.vue';
import { useRoute } from 'nuxt/app';
import { ShortcutSectionName, useHotkeys } from '@/composables/useHotkeys';
import type { FamilyTreeNodeType } from '@/types';

export default {
    setup() {
        const { refreshFamilyTree } = useWatchFamilyStore();

        const familyStore = useFamilyStore();
        const { currentFamilyTree, loadingFamily, family } = storeToRefs(familyStore);
        const route = useRoute();

        const { isMobile } = useDevice();

        const draggableZoneStore = useDraggableZoneStore();
        const { curDisplayType } = storeToRefs(draggableZoneStore);
        const { setHotkeysActions, unregisterHotkeys, notifyHotkeyAvailable } = useHotkeys();

        const maxScale = ref(3.6);
        const minScale = ref(0.5);
        const currentZoomPercent = ref(1);
        const sliderValue = ref([1, maxScale.value]);
        const stepValue = ref(0.03);

        let panzoom: PanzoomObject | undefined;

        const isMountedAndTriedToFetchFamilyTree = ref(false);

        const toastVisible = ref(false);
        const toastMessage = ref('');
        const toastType = ref<'info' | 'warning' | 'success'>('info');
        const toastActionLabel = ref('');
        const toastActionFn = ref<(() => void) | undefined>(undefined);
        let boundaryToastCooldown = false;

        const showFindPerson = ref(false);

        return {
            showFindPerson,
            isMountedAndTriedToFetchFamilyTree,
            loadingFamily,
            panzoom,
            familyStore,
            draggableZoneStore,
            family,
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
            ShortcutSectionName,
            toastVisible,
            toastMessage,
            toastType,
            toastActionLabel,
            toastActionFn,
            boundaryToastCooldown,
            notifyHotkeyAvailable,
            refreshFamilyTree,
            isMobile,
        }
    },
    components: {
        FamilyTree,
        DraggableSection,
        LoadingSpinner,
        FamilyDetailsDropdown,
        FamilyDetails,
        AddPersonToTree,
        FindPersonPanel,
        UiToast,
    },
    mounted() {
        this.isMountedAndTriedToFetchFamilyTree = true;

        const element: HTMLElement = this.$refs.treeContainer as HTMLElement;
        if (!element || !element.parentElement) return;

        this.panzoom = Panzoom(element, {
            minScale: this.minScale,
            maxScale: this.maxScale,
            step: this.stepValue,
            startScale: 1,
            startX: 0,
            startY: 0,
            isSVG: true,
            relative: false,
        });

        element.addEventListener('panzoomchange', () => {
            if (!this.panzoom) return;
            const scale = this.panzoom.getScale();
            this.sliderValue[0] = scale;
            this.currentZoomPercent = scale / this.maxScale;
            this.enforcePanBounds();
        });

        element.parentElement.addEventListener('wheel', (event: any) => {
            if (!this.panzoom) return;

            const currentScale = this.panzoom.getScale();
            let scale;

            if (event.deltaY < 0) {
                scale = Math.min(currentScale * (1 + this.stepValue), this.maxScale);
            } else {
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
        },
        enforcePanBounds() {
            if (!this.panzoom) return;

            const container = this.$refs.treeContainer as HTMLElement;
            if (!container || !container.parentElement) return;

            const parentRect = container.parentElement.getBoundingClientRect();
            const treeRect = container.getBoundingClientRect();
            const scale = this.panzoom.getScale();
            const { x: panX, y: panY } = this.panzoom.getPan();

            // Allow at least 15% of the tree to remain visible on each side
            const marginX = parentRect.width * 0.15;
            const marginY = parentRect.height * 0.15;

            // Calculate how far the tree can move before it's mostly off-screen
            const maxPanRight = parentRect.width - marginX;
            const maxPanLeft = -(treeRect.width - marginX);
            const maxPanDown = parentRect.height - marginY;
            const maxPanUp = -(treeRect.height - marginY);

            let clampedX = panX;
            let clampedY = panY;
            let wasClamped = false;

            if (panX > maxPanRight) { clampedX = maxPanRight; wasClamped = true; }
            if (panX < maxPanLeft) { clampedX = maxPanLeft; wasClamped = true; }
            if (panY > maxPanDown) { clampedY = maxPanDown; wasClamped = true; }
            if (panY < maxPanUp) { clampedY = maxPanUp; wasClamped = true; }

            if (wasClamped) {
                this.panzoom.pan(clampedX, clampedY, { animate: false });

                // Show toast (with cooldown to avoid spam)
                if (!this.boundaryToastCooldown) {
                    this.boundaryToastCooldown = true;
                    const msg = this.isMobile
                        ? 'You\'ve reached the edge! Tap the reset button to re-center.'
                        : 'You\'ve reached the edge! Press Shift+R or click the reset button to re-center.';
                    this.showToast(
                        msg,
                        'warning',
                        'Reset View',
                        () => this.resetZoomAndPan(),
                    );
                    setTimeout(() => { this.boundaryToastCooldown = false; }, 5000);
                }
            }
        },
        showToast(message: string, type: 'info' | 'warning' | 'success' = 'info', actionLabel?: string, actionFn?: () => void) {
            this.toastMessage = message;
            this.toastType = type;
            this.toastActionLabel = actionLabel || '';
            this.toastActionFn = actionFn;
            this.toastVisible = true;
        },
        closeToast() {
            this.toastVisible = false;
        },
    }
};
</script>

<template>
    <div class="relative min-h-[calc(100vh-3.5rem)] max-h-[calc(100vh-3.5rem)] w-full overflow-hidden">
        <FamilyDetailsDropdown v-show="currentFamilyTree" title="Family Details"
            @toggle:familyDetails="handleToggleFamilyDetails">
            <template #content>
                <FamilyDetails />
            </template>
        </FamilyDetailsDropdown>
        <DraggableSection v-show="currentFamilyTree && !loadingFamily">
            <div ref="treeContainer">
                <FamilyTree v-if="curDisplayType === 'mdi:family-tree'" @centerNode="centerOnNode" />
                <FamilySunburstChart />
            </div>
        </DraggableSection>

        <!-- SliderRange for zoom (hidden on mobile) -->
        <div v-if="currentFamilyTree && !loadingFamily && !isMobile"
            class="flex flex-col items-center absolute bottom-[51px] left-[0px] translate-x-[30px] bg-white dark:bg-black border hover:border-zinc-300 dark:border-zinc-600 dark:hover:border-zinc-100 rounded p-2">
            <Icon name="iconamoon:zoom-in-duotone" @click.stop="() => { zoomIn(); notifyHotkeyAvailable(); }"
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
            <Icon name="iconamoon:zoom-out-duotone" @click.stop="() => { zoomOut(); notifyHotkeyAvailable(); }"
                class="h-5 w-5 text-black dark:text-white cursor-pointer" />
        </div>
        <!-- Reset button: bottom-left on desktop, top-right on mobile (above bottom toolbar) -->
        <div v-if="currentFamilyTree && !loadingFamily"
            :class="[
                'flex items-center absolute bg-white/95 dark:bg-black/95 backdrop-blur-sm border hover:border-zinc-300 dark:border-zinc-600 dark:hover:border-zinc-100 rounded py-1 px-2 cursor-pointer z-20',
                isMobile ? 'top-3 right-3' : 'bottom-[12px] left-[0px] translate-x-[30px]'
            ]"
            @click.stop="() => { resetZoomAndPan(); notifyHotkeyAvailable(); }" title="Reset Zoom & Pan to original view (Shift+R)">
            <Icon name="carbon:zoom-reset" class="h-5 w-5 text-black dark:text-white" />
        </div>

        <!-- Find Person button -->
        <div v-if="currentFamilyTree && !loadingFamily"
            :class="[
                'flex items-center absolute bg-white/95 dark:bg-black/95 backdrop-blur-sm border hover:border-zinc-300 dark:border-zinc-600 dark:hover:border-zinc-100 rounded py-1 px-2 cursor-pointer z-20 gap-1.5',
                isMobile ? 'top-3 left-3' : 'bottom-[12px] left-[0px] translate-x-[100px]'
            ]"
            @click.stop="showFindPerson = true"
            title="Find & add a person to the tree"
        >
            <Icon name="lucide:user-search" class="h-5 w-5 text-black dark:text-white" />
            <span v-if="!isMobile" class="text-xs font-medium text-black dark:text-white">Find Person</span>
        </div>

        <!-- Find Person Panel -->
        <FindPersonPanel
            v-if="showFindPerson"
            @close="showFindPerson = false"
            @person-linked="refreshFamilyTree"
        />

        <!-- Toast notification -->
        <UiToast
            :message="toastMessage"
            :visible="toastVisible"
            :type="toastType"
            :action-label="toastActionLabel"
            :action-fn="toastActionFn"
            @close="closeToast"
        />

        <div v-if="isMountedAndTriedToFetchFamilyTree && !loadingFamily && !currentFamilyTree && family"
            class="absolute inset-0 w-full h-full flex flex-col items-center justify-center">
            <p class="text-zinc-600 dark:text-zinc-300 font-medium text-lg">
                This family tree has no members yet.
            </p>
            <p class="text-zinc-500 dark:text-zinc-400 text-sm mt-2 mb-4">
                Add the first person to start building the {{ family.familyName }} family tree.
            </p>
            <AddPersonToTree :familyId="family.id" @personAdded="refreshFamilyTree" />
        </div>
        <div v-else-if="isMountedAndTriedToFetchFamilyTree && !loadingFamily && !currentFamilyTree && !family"
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
        <div v-else-if="loadingFamily || !isMountedAndTriedToFetchFamilyTree" class="absolute inset-0 w-full h-full flex flex-col items-center justify-center">
            <LoadingSpinner />
            <p class="text-black dark:text-white mt-3 font-extralight text-sm">Loading the{{ ` ${route.params.familyName
                ||
                ''} ` }}family tree...</p>
        </div>
    </div>
</template>