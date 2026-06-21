<script setup lang="ts">
import { ref } from 'vue';
import { Icon } from '@iconify/vue';
import { Share } from '@capacitor/share';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const props = defineProps<{
    familyId: number;
}>();

const { isNative } = useDevice();
const authStore = useAuthStore();
const claimsStore = useClaimsStore();
const { user } = storeToRefs(authStore);

const exporting = ref(false);
const exportFormat = ref<'json' | 'csv'>('json');
const successMessage = ref('');

const handleExport = async () => {
    if (!user.value) return;

    exporting.value = true;
    successMessage.value = '';

    const data = await claimsStore.exportFamilyData(props.familyId, user.value.id, exportFormat.value);

    exporting.value = false;

    if (!data) return;

    // Trigger download or share
    const content = exportFormat.value === 'csv' ? data as string : JSON.stringify(data, null, 2);
    const filename = `family-export-${props.familyId}.${exportFormat.value}`;

    if (isNative) {
        // On native, use the share sheet so the user can save/send the data
        await Share.share({
            title: filename,
            text: content,
            dialogTitle: `Export family data as ${exportFormat.value.toUpperCase()}`,
        });
        await Haptics.impact({ style: ImpactStyle.Medium });
    } else {
        const mimeType = exportFormat.value === 'csv' ? 'text/csv' : 'application/json';
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    successMessage.value = `Data exported as ${exportFormat.value.toUpperCase()}`;
    setTimeout(() => successMessage.value = '', 3000);
};
</script>

<template>
    <div class="w-full p-4 border dark:border-zinc-700 rounded-lg">
        <h3 class="text-lg font-semibold dark:text-white mb-4 flex items-center gap-2">
            <Icon icon="mdi:download" class="w-5 h-5" />
            Export Data
        </h3>

        <div v-if="successMessage" class="mb-3 p-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded text-sm">
            {{ successMessage }}
        </div>

        <div v-if="claimsStore.error" class="mb-3 p-2 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded text-sm">
            {{ claimsStore.error }}
        </div>

        <p class="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
            Download your family data including all people, relationships, and marriages.
        </p>

        <div class="flex gap-2 mb-3">
            <button
                @click="exportFormat = 'json'"
                :class="[
                    'px-3 py-1 text-sm rounded-md transition-colors',
                    exportFormat === 'json' ? 'bg-blue-600 text-white' : 'bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300'
                ]"
            >
                JSON
            </button>
            <button
                @click="exportFormat = 'csv'"
                :class="[
                    'px-3 py-1 text-sm rounded-md transition-colors',
                    exportFormat === 'csv' ? 'bg-blue-600 text-white' : 'bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300'
                ]"
            >
                CSV
            </button>
        </div>

        <button
            @click="handleExport"
            :disabled="exporting"
            class="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
        >
            {{ exporting ? 'Exporting...' : `Export as ${exportFormat.toUpperCase()}` }}
        </button>
    </div>
</template>
