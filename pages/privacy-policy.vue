<script setup lang="ts">
const privacyPolicy = {
    lastUpdated: 'February 26, 2025',
    sections: [
        {
            title: 'Information We Collect',
            content: 'We collect information that you provide directly to us, including names, dates, family relationships, and optional photos. We also collect technical data like usage patterns to improve our service.',
            negatives: '- collect or store sensitive information such as social security numbers, financial data, IP addresses, or health information.'
        },
        {
            title: 'How We Use Your Information',
            content: 'Your information is used to create and maintain family trees, enable sharing with designated family members, and improve our services.',
            negatives: '- sell your personal data to third parties.'
        },
        {
            title: 'Data Storage and Security',
            content: 'All data is encrypted and stored securely. We use industry-standard security measures to protect your information from unauthorized access, disclosure, or misuse.',
            negatives: '- store sensitive information such as social security numbers, financial data, IP addresses, or health information.'
        },
        {
            title: 'Sharing Your Information',
            content: 'Your family tree data is private by default. You control who can view and edit your family tree through our sharing settings.',
            negatives: '- share your personal data with third parties for marketing purposes. Only family members you designate can access your family tree unless a family administrator changes your sharing settings.'
        },
        {
            title: 'Your Rights',
            content: 'You have the right to access, correct, or delete your personal information at any time. You can also request a copy of your data or restrict its processing.'
        },
        {
            title: 'Children\'s Privacy',
            content: 'We comply with children\'s privacy protection laws. Parental consent is required for users under 13.'
        }
    ]
};
</script>

<template>
    <div class="container mx-auto px-4 py-8 max-w-4xl">
        <h1 class="text-3xl font-bold mb-8 text-zinc-900 dark:text-zinc-100">Privacy Policy</h1>
        <p class="mb-6 text-zinc-600 dark:text-zinc-400">Last updated: {{ privacyPolicy.lastUpdated }}</p>

        <div class="space-y-8">
            <div v-for="(section, index) in privacyPolicy.sections" :key="index" class="bg-white dark:bg-zinc-800 rounded-lg p-6 shadow-sm">
                <h2 class="text-xl font-semibold mb-4 text-zinc-800 dark:text-zinc-200">{{ section.title }}</h2>
                <p class="text-zinc-600 dark:text-zinc-400">{{ section.content }}</p>

                <div v-if="section.negatives" class="mt-4">
                    <h4 class="text-md mb-2 text-zinc-800 dark:text-zinc-200">We Never:</h4>
                    <p class="text-zinc-600 dark:text-zinc-400">{{ section.negatives }}</p>
                </div>
            </div>
        </div>

        <div class="mt-12 p-6 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
            <h2 class="text-xl font-semibold mb-4 text-zinc-800 dark:text-zinc-200">Contact Us</h2>
            <!-- Change to privacy@mytrees.family -->
            <p class="text-zinc-600 dark:text-zinc-400">
                If you have any questions about this Privacy Policy, please contact us at support@familytrees.com
            </p>
        </div>
    </div>
</template>