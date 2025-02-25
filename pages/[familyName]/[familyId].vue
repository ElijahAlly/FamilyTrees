<script lang="ts">
import { Icon } from '@iconify/vue';
import { useFamilyStore } from '@/stores/family';
import { useDraggableZoneStore } from '@/stores/draggableZone';
import * as PanzoomModule from '@panzoom/panzoom';
const Panzoom = PanzoomModule.default;
import { type PanzoomObject } from '@panzoom/panzoom'; import { useWatchFamilyStore } from '@/composables/useWatchFamilyStore';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import FamilyTree from '@/components/family/FamilyTree.vue';
import DraggableSection from '@/components/family/DraggableSection.vue';
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue';
import FamilyDetailsDropdown from '@/components/family/FamilyDetailsDropdown.vue';
import FamilyDetails from '@/components/family/FamilyDetails.vue';

export default {
  setup() {
    const familyStore = useFamilyStore();
    const { curentFamilyTree, loadingFamily } = storeToRefs(familyStore);
    
    const draggableZoneStore = useDraggableZoneStore();
    const { curDisplayType } = storeToRefs(draggableZoneStore);

    const maxScale = ref(3.6);
    const minScale = ref(0.3);
    const currentZoomPercent = ref(1);
    const sliderValue = ref([1, maxScale.value]);
    const stepValue = ref(0.03);

    let panzoom: PanzoomObject | undefined;

    useWatchFamilyStore();

    const isMountedAndTriedToFetchFamilyTree = ref(false);

    return {
      isMountedAndTriedToFetchFamilyTree,
      loadingFamily,
      panzoom,
      familyStore,
      draggableZoneStore,
      sliderValue,
      stepValue,
      minScale,
      maxScale,
      currentZoomPercent,
      curentFamilyTree,
      curDisplayType
    }
  },
  components: {
    FamilyTree,
    DraggableSection,
    LoadingSpinner,
    FamilyDetailsDropdown
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
      relative: false
    });

    element.addEventListener('panzoomchange', (e) => {
      if (!this.panzoom) return;
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

    // Set scrolling capability to the tree
  },
  onBeforeUnmount() {
    this.isMountedAndTriedToFetchFamilyTree = true; 
  },
  methods: {
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
    <FamilyDetailsDropdown v-show="curentFamilyTree" title="Family Details">
      <template #content>
        <FamilyDetails />
      </template>
    </FamilyDetailsDropdown>
    <DraggableSection v-show="curentFamilyTree">
      <div ref="treeContainer">
        <FamilyTree v-if="curentFamilyTree && curDisplayType === 'mdi:family-tree'" :treeNode="curentFamilyTree"
          @centerNode="centerOnNode" />
        <!-- <FamilySunburstChart />  -->
      </div>
    </DraggableSection>

    <!-- SliderRange for zoom -->
    <div v-if="curentFamilyTree"
      class="flex flex-col items-center absolute bottom-[51px] left-[0px] translate-x-[30px] bg-white dark:bg-black border hover:border-zinc-300 dark:border-zinc-600 dark:hover:border-zinc-100 rounded p-2">
      <Icon name="iconamoon:zoom-in-duotone" @click.stop="zoomIn"
        class="h-5 w-5 text-black dark:text-white cursor-pointer" />
      <ui-slider-root v-model="sliderValue"
        class="relative flex items-center justify-center select-none touch-none h-[200px] w-3 my-3" :min="minScale"
        :max="maxScale" :step="stepValue" :minStepsBetweenThumbs="stepValue - 1" @update:modelValue="handleSliderDrag"
        orientation="vertical">
        <ui-slider-track class="relative grow rounded-full h-full bg-zinc-300 dark:bg-zinc-800" style="max-width: 9px;">
          <ui-slider-range class="absolute rounded-full h-full" />
        </ui-slider-track>
        <ui-slider-thumb
          class="block w-5 h-5 bg-zinc-950 dark:bg-zinc-300 hover:bg-zinc-900 dark:hover:bg-zinc-200 shadow-none focus:shadow-none rounded-full outline-none cursor-ns-resize"
          aria-label="Volume" :title="`${(currentZoomPercent * 100).toFixed(2)}%`" />
      </ui-slider-root>
      <Icon name="iconamoon:zoom-out-duotone" @click.stop="zoomOut"
        class="h-5 w-5 text-black dark:text-white cursor-pointer" />
    </div>
    <div v-if="curentFamilyTree"
      class="flex items-center absolute bottom-[12px] left-[0px] translate-x-[30px] bg-white dark:bg-black border hover:border-zinc-300 dark:border-zinc-600 dark:hover:border-zinc-100 rounded py-1 px-2 cursor-pointer">
      <Icon name="carbon:zoom-reset" @click.stop="resetZoomAndPan" class="h-5 w-5 text-black dark:text-white" />
    </div>

    <!-- Error Loading tree -->
    <div v-else-if="isMountedAndTriedToFetchFamilyTree && !loadingFamily && !curentFamilyTree"
      class="absolute inset-0 w-full h-full flex flex-col items-center">
      <p class="text-red-500 dark:text-red-500 font-medium text-lg mt-80">
        Error loading the{{ ` ${$route.params.familyName || ''} ` }}family tree! Please refresh or go back to
        <NuxtLink to="/discover" class="underline font-normal text-zinc-700 dark:text-zinc-300">
          <span>Discover</span>
        </NuxtLink>
        any try again.
      </p>
    </div>

    <!-- Loading tree -->
    <div v-else class="absolute inset-0 w-full h-full flex flex-col items-center justify-center">
      <LoadingSpinner />
      <p class="text-black dark:text-white mt-3 font-extralight text-sm">Loading the{{ ` ${$route.params.familyName ||
        ''} ` }}family tree...</p>
    </div>
  </div>
</template>
