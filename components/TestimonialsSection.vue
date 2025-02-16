<script setup lang="ts">
import type { AutoStyleClass } from '@/types/auto-styles';
const autoStyleClass: AutoStyleClass = 'testimonials-section-as';
import { computed } from 'vue';
import { Icon } from '@iconify/vue';

const testimonials = computed(() => [
    {
        name: 'Alex Johnson',
        funFact: 'Found his great-great-grandfather',
        avatar: '',
        quote: 'Viewing our family tree was a breeze and simple enough for the whole family. It was amazing that we could see our family history in one place.',
        rating: 4
    },
]);
</script>

<template>
    <section class="w-full py-20 bg-white dark:bg-zinc-950" :class="autoStyleClass">
        <div class="container mx-auto px-4">
            <div class="max-w-6xl mx-auto">
                <div class="text-center mb-16">
                    <h2 class="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                        What Our Clients Say
                    </h2>
                    <p class="text-lg text-zinc-600 dark:text-zinc-400">
                        Success stories from industry leaders
                    </p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div v-for="(testimonial, index) in testimonials"
                         :key="index"
                         class="p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300">
                        <div class="flex items-center gap-4 mb-6">
                            <div class="w-12 h-12 rounded-full overflow-hidden">
                                <img v-if="testimonial.avatar" :src="testimonial.avatar" :alt="testimonial.name" class="w-full h-full object-cover" />
                                <Icon v-else icon="mdi:user" class="dark:text-white text-center w-9 h-9" /> 
                            </div>
                            <div>
                                <h3 class="font-semibold text-zinc-900 dark:text-zinc-100">
                                    {{ testimonial.name }}
                                </h3>
                                <p class="text-sm text-zinc-600 dark:text-zinc-400">
                                    {{ testimonial.funFact }}
                                </p>
                            </div>
                        </div>
                        <p class="text-lg text-zinc-700 dark:text-zinc-300 mb-4">
                            "{{ testimonial.quote }}"
                        </p>
                        <div class="flex gap-1">
                            <div v-for="star in 5" :key="star">
                                <Icon v-if="star <= testimonial.rating" icon="fluent-color:star-24" class="w-5 h-5" />
                                <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" width="24" height="24" viewBox="0 0 24 24">
                                    <g fill="none">
                                        <path fill="url(#fluentColorStar240)" d="M10.788 3.103c.495-1.004 1.926-1.004 2.421 0l2.358 4.777l5.273.766c1.107.161 1.549 1.522.748 2.303l-3.816 3.72l.901 5.25c.19 1.103-.968 1.944-1.959 1.424l-4.716-2.48l-4.715 2.48c-.99.52-2.148-.32-1.96-1.424l.901-5.25l-3.815-3.72c-.801-.78-.359-2.142.748-2.302L8.43 7.88z" />
                                        <defs>
                                            <linearGradient id="fluentColorStar240" x1="21.994" x2="1.427" y1="21.928" y2="2.53" gradientUnits="userSpaceOnUse">
                                                <stop stop-color="#797979" />
                                                <stop offset="1" stop-color="#4f4f4f" />
                                            </linearGradient>
                                        </defs>
                                    </g>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>