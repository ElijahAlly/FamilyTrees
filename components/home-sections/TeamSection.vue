<script setup>
const team = [
    {
        name: 'Elijah Musa Ally',
        position: 'CEO & Founder',
        image: '/elijah_ally_profile.jpg',
        socials: [
            { name: 'LinkedIn', url: '#', icon: 'IconLinkedIn' },
            { name: 'Twitter', url: '#', icon: 'IconTwitter' }
        ]
    },
];
</script>

<template>
    <section class="w-full py-20 bg-zinc-50 dark:bg-zinc-900">
        <div class="container mx-auto px-4">
            <div class="max-w-6xl mx-auto">
                <div class="text-center mb-16">
                    <h2 class="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                        Meet Our Team
                    </h2>
                    <p class="text-lg text-zinc-600 dark:text-zinc-400">
                        The minds behind the innovation
                    </p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div v-for="(member, index) in team" :key="index" class="group">
                        <div class="relative overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800 p-6 transition-all duration-300 hover:translate-y-[-4px]">
                            <div class="aspect-square mb-6 overflow-hidden rounded-xl">
                                <img :src="member.image" 
                                     :alt="member.name"
                                     class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                            </div>
                            <h3 class="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                                {{ member.name }}
                            </h3>
                            <p class="text-zinc-600 dark:text-zinc-400 mb-4">
                                {{ member.position }}
                            </p>
                            <div class="flex gap-4">
                                <a v-for="social in member.socials" 
                                   :key="social.name"
                                   :href="social.url"
                                   class="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors">
                                    <component :is="social.icon" class="w-5 h-5" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>