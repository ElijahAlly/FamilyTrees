<script lang="ts" setup>
import HeroSection from '@/components/home-sections/HeroSection.vue';
import ProductShowcase from '@/components/home-sections/ProductShowcase.vue';
import FeaturesGrid from '@/components/home-sections/FeaturesGrid.vue';
import TeamSection from '@/components/home-sections/TeamSection.vue';
import TestimonialsSection from '@/components/home-sections/TestimonialsSection.vue';
import PricingTiers from '@/components/home-sections/PricingTiers.vue';
import CtaSection from '@/components/home-sections/CtaSection.vue';
</script>

<template>
    <div class="w-full h-fit flex flex-col items-center justify-center">
        <HeroSection />
        <ProductShowcase />
        <FeaturesGrid />
        <TeamSection />
        <TestimonialsSection />
        <PricingTiers />
        <CtaSection />
    </div>
</template>