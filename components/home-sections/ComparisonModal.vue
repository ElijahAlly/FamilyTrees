<script setup lang="ts">
import { computed, type PropType } from 'vue';
import Modal from '../ui/Modal.vue';
import { type Plan, getPlanText } from '@/types';
import { Icon } from '@iconify/vue';

const props = defineProps({
    isOpen: { type: Boolean, default: false },
    plans: { type: Object as PropType<Plan[]>, default: [] },
});

const emit = defineEmits<{
    'update:isOpen': [value: boolean];
}>();

// Get all unique features across all plans
const allFeatures = computed(() => {
    const featureSet = new Set<string>();
    props.plans.forEach(plan => {
        plan.features.forEach(feature => {
            if (feature.includeWhenComparing) featureSet.add(feature.name);
        });
    });
    return Array.from(featureSet);
});

// Check if a plan includes a feature
const hasFeature = (plan: Plan, featureName: string) => {
    return plan.features.some(f => f.name === featureName && f.included);
};
</script>

<template>
    <Modal :isOpen="isOpen" width="w-6xl max-w-[75vw]" @update:is-open="(val) => emit('update:isOpen', val)">
        <div class="pt-4">
            <h2 class="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
                Plan Comparison
            </h2>

            <div class="overflow-auto max-h-[60vh] pb-24">
                <table class="relative w-full text-left">
                    <thead class="sticky top-0 left-0 bg-white dark:bg-zinc-900">
                        <tr class="border-b border-zinc-200 dark:border-zinc-700">
                            <th class="py-4 px-6 min-w-[200px] dark:text-zinc-100">Features</th>
                            <th v-for="plan in plans" :key="plan.name" class="py-4 px-6 text-center min-w-[180px]">
                                <div class="font-bold text-lg text-zinc-900 dark:text-zinc-100">
                                    {{ getPlanText(plan.name) }}
                                </div>
                                <div class="text-zinc-600 dark:text-zinc-400 mt-1">
                                    ${{ plan.price }}/month
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="feature in allFeatures" :key="feature"
                            class="border-b border-zinc-200 dark:border-zinc-700">
                            <td class="py-4 px-6 text-zinc-900 dark:text-zinc-100">
                                {{ feature }}
                            </td>
                            <td v-for="plan in plans" :key="`${plan.name}-${feature}`" class="py-4 px-6 text-center">
                                <Icon v-if="hasFeature(plan, feature)" icon="iconamoon:check-light"
                                    class="w-6 h-6 mx-auto text-green-500" />
                                <Icon v-else icon="iconamoon:close-light" class="w-6 h-6 mx-auto text-red-500" />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </Modal>
</template>