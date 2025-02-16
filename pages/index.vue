<script setup lang="ts">
import type { AutoStyleClass } from '@/types/auto-styles';

const autoStyleClass: AutoStyleClass = 'index-as';
</script>

<template>
    <div class="w-full h-fit flex flex-col items-center justify-center" :class="autoStyleClass">
        <HeroSection />
        <ProductShowcase />
        <FeaturesGrid />
        <TeamSection />
        <TestimonialsSection />
        <PricingTiers />
        <CtaSection />
    </div>
</template>