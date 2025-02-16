<script setup lang="ts">
import type { AutoStyleClass } from '@/types/auto-styles';

const autoStyleClass: AutoStyleClass = 'cta-section-as';
</script>

<template>
    <section class="w-full py-20 bg-gradient-to-br dark:bg-gradient-to-b from-zinc-900 via-zinc-800 to-neutral-900 dark:from-zinc-950 dark:to-neutral-900" :class="autoStyleClass">
        <div class="container mx-auto px-4">
            <div class="max-w-4xl mx-auto text-center">
                <h2 class="text-4xl md:text-5xl font-bold text-zinc-100 mb-6">
                    Ready to Get Started?
                </h2>
                <p class="text-lg text-zinc-300 mb-8">
                    Join thousands of users already transforming their projects
                </p>
                <button class="px-8 py-4 rounded-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 transition-all duration-300 text-lg font-medium">
                    Start Free Trial
                </button>
            </div>
        </div>
    </section>
</template>
