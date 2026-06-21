<script setup lang="ts">
import { Icon } from '@iconify/vue';
import type { ViewType } from '@/types';

const props = defineProps<{
    currentView: ViewType;
    isOwnProfile: boolean;
    availableViews: ViewType[];
}>();

const emit = defineEmits<{
    'change-view': [view: ViewType];
}>();

const viewConfig: Record<ViewType, { label: string; icon: string; color: string }> = {
    private: { label: 'Personal', icon: 'mdi:eye-lock', color: 'text-purple-600 dark:text-purple-400' },
    family: { label: 'Family', icon: 'mdi:home-heart', color: 'text-blue-600 dark:text-blue-400' },
    friends: { label: 'Friends', icon: 'mdi:account-group', color: 'text-green-600 dark:text-green-400' },
    public: { label: 'Public', icon: 'mdi:earth', color: 'text-orange-600 dark:text-orange-400' },
};
</script>

<template>
    <div v-if="isOwnProfile" class="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
        <button
            v-for="view in availableViews"
            :key="view"
            @click="emit('change-view', view)"
            :class="[
                'flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-all',
                currentView === view
                    ? 'bg-white dark:bg-zinc-700 shadow-sm ' + viewConfig[view].color
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
            ]"
            :title="`Preview ${viewConfig[view].label} view`"
        >
            <Icon :icon="viewConfig[view].icon" class="w-4 h-4" />
            <span class="hidden sm:inline">{{ viewConfig[view].label }}</span>
        </button>
    </div>
</template>
