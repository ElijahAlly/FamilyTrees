<script setup>
const features = [
    {
        title: 'Lightning Fast',
        description: 'Optimized for speed and performance',
        icon: 'IconBolt'
    },
    // ... Add more features
];
</script>

<template>
    <section class="w-full py-20 bg-zinc-100 dark:bg-zinc-950">
        <div class="container mx-auto px-4">
            <div class="max-w-6xl mx-auto">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div v-for="(feature, index) in features" 
                         :key="index"
                         class="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300 group">
                        <div class="w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                            <component :is="feature.icon" class="w-6 h-6 text-zinc-900 dark:text-zinc-100" />
                        </div>
                        <h3 class="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                            {{ feature.title }}
                        </h3>
                        <p class="text-zinc-600 dark:text-zinc-400">
                            {{ feature.description }}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>