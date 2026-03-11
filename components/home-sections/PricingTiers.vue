<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import type { FetchTypeList, Plan } from '@/types';
import { getPlanText, PlanName } from '@/types';
import ComparisonModal from './ComparisonModal.vue';

const plans = ref<Plan[]>([]);
const showComparison = ref(false);

const getPlanFeatures = (plan: Plan) => {
    return plan.features.filter(f => f.lowestTierToInclude);
}

onMounted(async () => {
    const { data: planData, error: planError }: FetchTypeList<Plan> = await $fetch('/api/get-plans', { method: 'GET' });
    if (planError) return;
    plans.value = planData;
})

// const plans = [
//     {
//         name: 'Free Plan',
//         description: 'Perfect for small projects',
//         price: 0,
//         popular: false,
//         features: [
//             'Look for your family',
//             'Start your family tree',
//             'Add up to 3 family members (not including yourself)',
//             'Add up to 3 pictures per family member',
//             'Advanced family visualization',
//             '24/7 Support'
//         ]
//     },
//     {
//         name: 'Personal Plan',
//         description: 'Best for a complete family tree',
//         price: 19,
//         popular: true,
//         features: [
//             'Everything in Just Looking &...',
//             'Add unlimited family members',
//             'Make your family tree private (only visible by a link)',
//         ]
//     },
//     {
//         name: 'Family Plan',
//         description: 'For the whole family!',
//         price: 99,
//         popular: false,
//         features: [
//             'Everything in Pro &...',
//             'Dedicated Account Manager(s)',
//             'Advanced Security',
//         ]
//     }
// ];
</script>

<template>
    <section class="flex flex-col items-center w-full py-20 bg-zinc-50 dark:bg-zinc-900">
        <div class="container mx-auto px-4">
            <div class="max-w-6xl mx-auto">
                <div class="text-center mb-16">
                    <h2 class="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                        Simple, Transparent Pricing
                    </h2>
                    <p class="text-lg text-zinc-600 dark:text-zinc-400">
                        Choose the plan that works best for your family or just yourself
                    </p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div v-for="(plan, index) in plans" :key="index" :class="[
                            'p-8 rounded-2xl transition-all duration-200 flex flex-col',
                            plan.name === PlanName.PERSONAL 
                                ? 'bg-gradient-to-b from-zinc-900 to-zinc-600 dark:from-zinc-800 dark:to-zinc-900 text-white transform scale-105 hover:scale-100' 
                                : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                        ]">
                        <div v-if="plan.name === PlanName.PERSONAL" class="absolute right-0 top-0">
                            <div class="relative h-[72px] w-[72px] overflow-hidden">
                                <span
                                    class="absolute top-[12px] right-[-22px] rotate-45 block w-[100px] text-center bg-violet-600 text-white text-sm font-medium py-1">
                                    Popular
                                </span>
                            </div>
                        </div>
                        <div class="mb-8">
                            <h3 :class="[
                                'text-2xl font-bold mb-2',
                                plan.name === PlanName.PERSONAL ? 'text-white' : 'text-zinc-900 dark:text-zinc-100'
                            ]">
                                {{ getPlanText(plan.name) }} Plan
                            </h3>
                            <p :class="[
                                'text-sm',
                                plan.name === PlanName.PERSONAL ? 'text-zinc-200' : 'text-zinc-600 dark:text-zinc-400'
                            ]">
                                {{ plan.description }}
                            </p>
                        </div>

                        <div class="mb-8">
                            <span :class="[
                                'text-4xl font-bold',
                                plan.name === PlanName.PERSONAL ? 'text-white' : 'text-zinc-900 dark:text-zinc-100'
                            ]">
                                ${{ plan.price }}
                            </span>
                            <span :class="[
                                'text-sm',
                                plan.name === PlanName.PERSONAL ? 'text-zinc-200' : 'text-zinc-600 dark:text-zinc-400'
                            ]">
                                /month
                            </span>
                        </div>

                        <ul class="mb-auto space-y-4">
                            <li v-for="(feature, featureIndex) in getPlanFeatures(plan)" :key="featureIndex"
                                class="flex items-center gap-3">
                                <Icon v-if="feature.included" icon="iconamoon:check-light" class="min-w-5 min-h-5"
                                    :class="{'text-zinc-200': plan.name === PlanName.PERSONAL, 'text-zinc-600 dark:text-zinc-400': plan.name !== PlanName.PERSONAL}" />
                                <Icon v-else icon="iconamoon:close-light" class="w-5 h-5"
                                    :class="{ 'text-red-200': plan.name === PlanName.PERSONAL, 'text-red-600 dark:text-red-400': plan.name !== PlanName.PERSONAL }" />
                                <span
                                    :class="{'text-zinc-200': plan.name === PlanName.PERSONAL, 'text-zinc-600 dark:text-zinc-400': plan.name !== PlanName.PERSONAL}">
                                    {{ feature.name }}
                                </span>
                            </li>
                        </ul>

                        <ui-button size="fit" :variant="plan.name === PlanName.PERSONAL ? 'default' : 'submit'"
                            class="w-full mt-6">
                            Get Started
                        </ui-button>
                    </div>
                </div>
            </div>
        </div>

        <ui-button variant="transparent" class="min-w-48 mt-9 text-nowrap" @click="showComparison = true">
            Compare All Plans
        </ui-button>
        <ComparisonModal v-model:is-open="showComparison" :plans="plans" />
    </section>
</template>