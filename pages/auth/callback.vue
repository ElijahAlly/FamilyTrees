<script setup lang="ts">
import type { AutoStyleClass } from '@/types/auto-styles';
const autoStyleClass: AutoStyleClass = 'callback-as';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const router = useRouter();
const loading = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
    try {
        await auth.handleAuthStateChange();
        
        if (auth.user && auth.profile) {
            await router.push('/profile');
        } else {
            throw new Error('Authentication failed');
        }
    } catch (e: any) {
        error.value = e.message;
        await router.push('/discover');
    } finally {
        loading.value = false;
    }
})
</script>

<template>
    <div class="container mx-auto p-8" :class="autoStyleClass">
        <div class="card p-8 text-center space-y-4">
            <div v-if="error" class="bg-red-50 p-4 rounded-lg">
                <p class="text-red-500 font-medium">{{ error }}</p>
                <p class="text-sm text-gray-600 mt-2">Redirecting to login...</p>
            </div>
            <div v-else-if="loading" class="bg-gray-900 flex flex-col items-center pt-48 min-h-screen">
                <LoadingSpinner />
                <p class="mt-4 text-sm text-gray-50">Completing authentication...</p>
                <p class="mt-2 text-xs text-gray-400">Please wait...</p>
            </div>
        </div>
    </div>
</template>