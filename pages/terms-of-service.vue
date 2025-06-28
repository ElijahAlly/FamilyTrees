<script setup lang="ts">
const termsOfService = {
    lastUpdated: 'February 26, 2025',
    sections: [
        {
            title: 'Acceptance of Terms',
            content: 'By accessing and using MyTrees.family, you agree to be bound by these Terms of Service and all applicable laws and regulations.'
        },
        {
            title: 'User Accounts',
            content: 'You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.'
        },
        {
            title: 'Content Ownership',
            content: 'Users retain all ownership rights to their content. By uploading content, you grant MyTrees.family a license to use, store, and display that content to provide our services.'
        },
        {
            title: 'Acceptable Use',
            content: 'You agree not to misuse our services or help anyone else do so. This includes unauthorized access, interference with the service, or using the service for illegal purposes.'
        },
        {
            title: 'Termination',
            content: 'We may terminate or suspend your account at any time for any reason, including violation of these Terms of Service.'
        },
        {
            title: 'Changes to Terms',
            content: 'We reserve the right to modify these terms at any time. We will notify users of any material changes to these terms.'
        }
    ]
};
</script>

<template>
    <div class="container mx-auto px-4 py-8 max-w-4xl">
        <h1 class="text-3xl font-bold mb-8 text-zinc-900 dark:text-zinc-100">Terms of Service</h1>
        <p class="mb-6 text-zinc-600 dark:text-zinc-400">Last updated: {{ termsOfService.lastUpdated }}</p>

        <div class="space-y-8">
            <div v-for="(section, index) in termsOfService.sections" :key="index" class="bg-white dark:bg-zinc-800 rounded-lg p-6 shadow-sm">
                <h2 class="text-xl font-semibold mb-4 text-zinc-800 dark:text-zinc-200">{{ section.title }}</h2>
                <p class="text-zinc-600 dark:text-zinc-400">{{ section.content }}</p>
            </div>
        </div>

        <div class="mt-12 p-6 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
            <h2 class="text-xl font-semibold mb-4 text-zinc-800 dark:text-zinc-200">Contact Us</h2>
            <!-- change to terms@mytrees.family -->
            <p class="text-zinc-600 dark:text-zinc-400">
                If you have any questions about these Terms of Service, please contact us at support@mytrees.family
            </p>
        </div>
    </div>
</template>