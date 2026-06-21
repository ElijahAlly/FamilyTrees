<script setup lang="ts">
import { ref, computed } from 'vue';
import { Icon } from '@iconify/vue';
import { Share } from '@capacitor/share';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import type { InviteLink } from '@/types';

const props = defineProps<{
    familyId: number;
    personId?: number;
}>();

const { isNative } = useDevice();
const authStore = useAuthStore();
const claimsStore = useClaimsStore();
const { user } = storeToRefs(authStore);

const inviteType = ref<'family' | 'person'>(props.personId ? 'person' : 'family');
const maxUses = ref<number | undefined>(undefined);
const expiresInDays = ref<number | undefined>(7);
const generatedLink = ref<InviteLink | null>(null);
const generating = ref(false);
const copied = ref(false);

// Bulk invite state
const bulkMode = ref(false);
const bulkCount = ref(5);
const bulkMaxUsesPerLink = ref(1);
const bulkLinks = ref<InviteLink[]>([]);
const bulkCopied = ref(false);

const inviteUrl = computed(() => {
    if (!generatedLink.value) return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}/discover?invite=${generatedLink.value.code}`;
});

const bulkUrls = computed(() => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return bulkLinks.value.map(link => `${baseUrl}/discover?invite=${link.code}`);
});

const handleGenerate = async () => {
    if (!user.value) return;

    generating.value = true;

    const result = await claimsStore.createInviteLink({
        familyId: props.familyId,
        userId: user.value.id,
        type: inviteType.value,
        personId: props.personId,
        maxUses: maxUses.value,
        expiresInDays: expiresInDays.value,
    });

    generating.value = false;

    if (result) {
        generatedLink.value = result;
    }
};

const handleBulkGenerate = async () => {
    if (!user.value) return;

    generating.value = true;

    const result = await claimsStore.bulkCreateInviteLinks({
        familyId: props.familyId,
        userId: user.value.id,
        count: bulkCount.value,
        maxUsesPerLink: bulkMaxUsesPerLink.value,
        expiresInDays: expiresInDays.value,
    });

    generating.value = false;

    if (result) {
        bulkLinks.value = result;
    }
};

const copyToClipboard = async () => {
    try {
        if (isNative) {
            await Share.share({
                title: 'Join my family tree',
                text: 'Use this link to join my family tree on MyTrees.family',
                url: inviteUrl.value,
                dialogTitle: 'Share invite link',
            });
            await Haptics.impact({ style: ImpactStyle.Light });
        } else {
            await navigator.clipboard.writeText(inviteUrl.value);
        }
        copied.value = true;
        setTimeout(() => copied.value = false, 2000);
    } catch (err) {
        console.error('Failed to copy:', err);
    }
};

const copyAllBulkLinks = async () => {
    try {
        const allLinks = bulkUrls.value.join('\n');
        if (isNative) {
            await Share.share({
                title: 'Family tree invite links',
                text: allLinks,
                dialogTitle: 'Share invite links',
            });
            await Haptics.impact({ style: ImpactStyle.Light });
        } else {
            await navigator.clipboard.writeText(allLinks);
        }
        bulkCopied.value = true;
        setTimeout(() => bulkCopied.value = false, 2000);
    } catch (err) {
        console.error('Failed to copy:', err);
    }
};

const resetForm = () => {
    generatedLink.value = null;
    bulkLinks.value = [];
    bulkMode.value = false;
};
</script>

<template>
    <div class="w-full p-4 border dark:border-zinc-700 rounded-lg">
        <h3 class="text-lg font-semibold dark:text-white mb-4 flex items-center gap-2">
            <Icon icon="mdi:link-variant" class="w-5 h-5" />
            Invite Link
        </h3>

        <!-- Single generated link display -->
        <div v-if="generatedLink && !bulkMode" class="mb-4">
            <div class="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 rounded-md p-3">
                <input
                    :value="inviteUrl"
                    readonly
                    class="flex-1 bg-transparent text-sm dark:text-white outline-none truncate"
                />
                <button
                    @click="copyToClipboard"
                    class="shrink-0 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                    {{ copied ? 'Copied!' : (isNative ? 'Share' : 'Copy') }}
                </button>
            </div>
            <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                <span v-if="generatedLink.expiresAt">Expires: {{ new Date(generatedLink.expiresAt).toLocaleDateString() }}</span>
                <span v-if="generatedLink.maxUses"> | Max uses: {{ generatedLink.maxUses }}</span>
            </p>
        </div>

        <!-- Bulk generated links display -->
        <div v-if="bulkLinks.length > 0" class="mb-4">
            <div class="flex items-center justify-between mb-2">
                <p class="text-sm font-medium dark:text-white">{{ bulkLinks.length }} links generated</p>
                <button
                    @click="copyAllBulkLinks"
                    class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                    {{ bulkCopied ? 'Copied All!' : (isNative ? 'Share All' : 'Copy All') }}
                </button>
            </div>
            <div class="max-h-40 overflow-y-auto space-y-1 bg-zinc-100 dark:bg-zinc-800 rounded-md p-2">
                <p v-for="(url, i) in bulkUrls" :key="i" class="text-xs text-zinc-600 dark:text-zinc-400 truncate font-mono">
                    {{ i + 1 }}. {{ url }}
                </p>
            </div>
            <p v-if="bulkLinks[0]?.expiresAt" class="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Expires: {{ new Date(bulkLinks[0].expiresAt).toLocaleDateString() }}
                | {{ bulkMaxUsesPerLink }} use(s) per link
            </p>
        </div>

        <!-- Generation form -->
        <div v-if="!generatedLink && bulkLinks.length === 0" class="space-y-3">
            <!-- Mode toggle -->
            <div class="flex items-center gap-2 mb-2">
                <button
                    @click="bulkMode = false"
                    :class="[
                        'px-3 py-1 text-sm rounded-md transition-colors',
                        !bulkMode ? 'bg-blue-600 text-white' : 'bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300'
                    ]"
                >
                    Single
                </button>
                <button
                    @click="bulkMode = true"
                    :class="[
                        'px-3 py-1 text-sm rounded-md transition-colors',
                        bulkMode ? 'bg-blue-600 text-white' : 'bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300'
                    ]"
                >
                    Bulk
                </button>
            </div>

            <!-- Single mode options -->
            <div v-if="!bulkMode">
                <div>
                    <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        Invite type
                    </label>
                    <select
                        v-model="inviteType"
                        class="w-full border dark:border-zinc-600 rounded-md p-2 text-sm dark:bg-zinc-800 dark:text-white"
                    >
                        <option value="family">Invite to join family</option>
                        <option v-if="personId" value="person">Invite to claim a specific person</option>
                    </select>
                </div>

                <div class="flex gap-3 mt-3">
                    <div class="flex-1">
                        <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Max uses (optional)
                        </label>
                        <input
                            type="number"
                            v-model.number="maxUses"
                            min="1"
                            class="w-full border dark:border-zinc-600 rounded-md p-2 text-sm dark:bg-zinc-800 dark:text-white"
                            placeholder="Unlimited"
                        />
                    </div>
                    <div class="flex-1">
                        <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Expires in (days)
                        </label>
                        <input
                            type="number"
                            v-model.number="expiresInDays"
                            min="1"
                            class="w-full border dark:border-zinc-600 rounded-md p-2 text-sm dark:bg-zinc-800 dark:text-white"
                            placeholder="Never"
                        />
                    </div>
                </div>

                <button
                    @click="handleGenerate"
                    :disabled="generating"
                    class="w-full mt-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                    {{ generating ? 'Generating...' : 'Generate Invite Link' }}
                </button>
            </div>

            <!-- Bulk mode options -->
            <div v-else class="space-y-3">
                <p class="text-xs text-zinc-500 dark:text-zinc-400">
                    Generate multiple single-use invite links at once for large families.
                </p>

                <div class="flex gap-3">
                    <div class="flex-1">
                        <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Number of links
                        </label>
                        <input
                            type="number"
                            v-model.number="bulkCount"
                            min="2"
                            max="50"
                            class="w-full border dark:border-zinc-600 rounded-md p-2 text-sm dark:bg-zinc-800 dark:text-white"
                        />
                    </div>
                    <div class="flex-1">
                        <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Uses per link
                        </label>
                        <input
                            type="number"
                            v-model.number="bulkMaxUsesPerLink"
                            min="1"
                            class="w-full border dark:border-zinc-600 rounded-md p-2 text-sm dark:bg-zinc-800 dark:text-white"
                        />
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        Expires in (days)
                    </label>
                    <input
                        type="number"
                        v-model.number="expiresInDays"
                        min="1"
                        class="w-full border dark:border-zinc-600 rounded-md p-2 text-sm dark:bg-zinc-800 dark:text-white"
                        placeholder="Never"
                    />
                </div>

                <button
                    @click="handleBulkGenerate"
                    :disabled="generating || bulkCount < 2"
                    class="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                    {{ generating ? 'Generating...' : `Generate ${bulkCount} Invite Links` }}
                </button>
            </div>
        </div>

        <!-- Generate new link button (when one already exists) -->
        <button
            v-if="generatedLink || bulkLinks.length > 0"
            @click="resetForm"
            class="w-full mt-2 py-2 border dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-sm"
        >
            Generate New Link{{ bulkMode ? 's' : '' }}
        </button>
    </div>
</template>
