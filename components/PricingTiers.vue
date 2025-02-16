<script setup lang="ts">
import type { AutoStyleClass } from '@/types/auto-styles';
const autoStyleClass: AutoStyleClass = 'pricing-tiers-as';
const plans = [
    {
        name: 'Just Looking',
        description: 'Perfect for small projects',
        price: 0,
        popular: false,
        features: [
            'Look for your family',
            'Start your family tree',
            'Add up to 3 family members (not including yourself)',
            'Add up to 3 pictures per family member',
            'Advanced family visualization',
            '24/7 Support'
        ]
    },
    {
        name: 'Personal Plan',
        description: 'Best for a complete family tree',
        price: 19,
        popular: true,
        features: [
            'Everything in Just Looking &...',
            'Add unlimited family members',
            'Make your family tree private (only visible by a link)',
        ]
    },
    {
        name: 'Family Plan',
        description: 'For the whole family!',
        price: 99,
        popular: false,
        features: [
            'Everything in Pro &...',
            'Dedicated Account Manager(s)',
            'Advanced Security',
        ]
    }
];
</script>

<template>
    <section class="w-full py-20 bg-zinc-50 dark:bg-zinc-900" :class="autoStyleClass">
        <div class="container mx-auto px-4">
            <div class="max-w-6xl mx-auto">
                <div class="text-center mb-16">
                    <h2 class="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                        Simple, Transparent Pricing
                    </h2>
                    <p class="text-lg text-zinc-600 dark:text-zinc-400">
                        Choose the plan that works best for you
                    </p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div v-for="(plan, index) in plans" 
                        :key="index"
                        :class="[
                            'p-8 rounded-2xl transition-all duration-200',
                            plan.popular 
                                ? 'bg-gradient-to-b from-zinc-900 to-zinc-600 dark:from-zinc-800 dark:to-zinc-900 text-white transform hover:scale-105' 
                                : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                        ]"
                    >
                        <div v-if="plan.popular" class="absolute right-0 top-0">
                            <div class="relative h-[72px] w-[72px] overflow-hidden">
                                <span class="absolute top-[12px] right-[-22px] rotate-45 block w-[100px] text-center bg-violet-600 text-white text-sm font-medium py-1">
                                    Popular
                                </span>
                            </div>
                        </div>
                        <div class="mb-8">
                            <h3 :class="[
                                'text-2xl font-bold mb-2',
                                plan.popular ? 'text-white' : 'text-zinc-900 dark:text-zinc-100'
                            ]">
                                {{ plan.name }}
                            </h3>
                            <p :class="[
                                'text-sm',
                                plan.popular ? 'text-zinc-200' : 'text-zinc-600 dark:text-zinc-400'
                            ]">
                                {{ plan.description }}
                            </p>
                        </div>

                        <div class="mb-8">
                            <span :class="[
                                'text-4xl font-bold',
                                plan.popular ? 'text-white' : 'text-zinc-900 dark:text-zinc-100'
                            ]">
                                ${{ plan.price }}
                            </span>
                            <span :class="[
                                'text-sm',
                                plan.popular ? 'text-zinc-200' : 'text-zinc-600 dark:text-zinc-400'
                            ]">
                                /month
                            </span>
                        </div>

                        <ul class="mb-8 space-y-4">
                            <li v-for="(feature, featureIndex) in plan.features" :key="featureIndex" class="flex items-center gap-3">
                                <IconCheck class="w-5 h-5" :class="{'text-zinc-200': plan.popular, 'text-zinc-600 dark:text-zinc-400': !plan.popular}" />
                                <span :class="{'text-zinc-200': plan.popular, 'text-zinc-600 dark:text-zinc-400': !plan.popular}">
                                    {{ feature }}
                                </span>
                            </li>
                        </ul>

                        <ui-button size="fit" :variant="plan.popular ? 'default' : 'outline'">
                            Get Started
                        </ui-button>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>