<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import type { MediaSubmission } from '@/types';

const props = defineProps<{
    familyId: number;
}>();

const authStore = useAuthStore();
const { user } = storeToRefs(authStore);

const submissions = ref<MediaSubmission[]>([]);
const loading = ref(false);
const reviewingId = ref<number | null>(null);

const fetchPending = async () => {
    if (!user.value) return;
    loading.value = true;

    try {
        const { data } = await $fetch('/api/media/pending', {
            method: 'GET',
            params: {
                familyId: props.familyId,
                userId: user.value.id,
            },
        }) as any;

        submissions.value = data || [];
    } catch (err) {
        console.error('Failed to fetch pending media:', err);
    } finally {
        loading.value = false;
    }
};

const handleReview = async (submissionId: number, action: 'approve' | 'deny') => {
    if (!user.value) return;
    reviewingId.value = submissionId;

    try {
        const result = await $fetch('/api/media/review', {
            method: 'POST',
            body: {
                submissionId,
                userId: user.value.id,
                action,
            },
        }) as any;

        if (result.success) {
            await fetchPending();
        }
    } catch (err) {
        console.error('Failed to review media:', err);
    } finally {
        reviewingId.value = null;
    }
};

onMounted(fetchPending);
</script>

<template>
    <div class="w-full">
        <h3 class="text-lg font-semibold dark:text-white mb-3 flex items-center gap-2">
            <Icon icon="mdi:image-check" class="w-5 h-5" />
            Pending Media
            <span v-if="submissions.length" class="text-sm bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-full">
                {{ submissions.length }}
            </span>
        </h3>

        <div v-if="loading" class="text-zinc-500 dark:text-zinc-400 text-sm py-4">
            Loading...
        </div>

        <div v-else-if="submissions.length === 0" class="text-zinc-500 dark:text-zinc-400 text-sm py-4">
            No pending media submissions.
        </div>

        <div v-else class="space-y-3">
            <div
                v-for="sub in submissions"
                :key="sub.id"
                class="border dark:border-zinc-700 rounded-lg p-3"
            >
                <div class="flex gap-3">
                    <div class="w-16 h-16 bg-zinc-200 dark:bg-zinc-700 rounded overflow-hidden flex-shrink-0">
                        <img :src="sub.mediaUrl" :alt="sub.caption || 'Submitted media'" class="w-full h-full object-cover" />
                    </div>
                    <div class="flex-1">
                        <p class="text-sm dark:text-white font-medium">{{ sub.submitterName || 'Unknown' }}</p>
                        <p v-if="sub.caption" class="text-xs text-zinc-500 dark:text-zinc-400">{{ sub.caption }}</p>
                        <p class="text-xs text-zinc-400 mt-1">{{ new Date(sub.createdAt).toLocaleDateString() }}</p>
                    </div>
                </div>
                <div class="flex gap-2 mt-2">
                    <button
                        @click="handleReview(sub.id, 'approve')"
                        :disabled="reviewingId === sub.id"
                        class="flex-1 px-3 py-1.5 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                    >
                        Approve
                    </button>
                    <button
                        @click="handleReview(sub.id, 'deny')"
                        :disabled="reviewingId === sub.id"
                        class="flex-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                        Deny
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
