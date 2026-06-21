<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { Icon } from '@iconify/vue';
import type { ActivityLog, ActionType } from '@/types/activity';
import { useActivityLog } from '@/composables/useActivityLog';

const props = defineProps<{
    familyId: number;
}>();

const { getActivities } = useActivityLog();

const logs = ref<ActivityLog[]>([]);
const loading = ref(false);
const expanded = ref(false);
const limit = ref(20);

const actionLabels: Partial<Record<ActionType, { label: string; icon: string; color: string }>> = {
    ADDED_PERSON: { label: 'Person added', icon: 'mdi:account-plus', color: 'text-emerald-500' },
    REMOVED_PERSON: { label: 'Person removed', icon: 'mdi:account-minus', color: 'text-red-500' },
    PERSON_UPDATED: { label: 'Person updated', icon: 'mdi:account-edit', color: 'text-blue-500' },
    NAME_CHANGED: { label: 'Name changed', icon: 'mdi:rename', color: 'text-amber-500' },
    MARRIAGE_ADDED: { label: 'Marriage added', icon: 'mdi:heart', color: 'text-pink-500' },
    MARRIAGE_REMOVED: { label: 'Marriage removed', icon: 'mdi:heart-broken', color: 'text-pink-400' },
    FAMILY_UPDATED: { label: 'Family updated', icon: 'mdi:family-tree', color: 'text-blue-500' },
    FAMILY_CREATED: { label: 'Family created', icon: 'mdi:plus-circle', color: 'text-emerald-500' },
    CLAIM_REQUESTED: { label: 'Claim requested', icon: 'mdi:hand-pointing-up', color: 'text-amber-500' },
    CLAIM_APPROVED: { label: 'Claim approved', icon: 'mdi:check-circle', color: 'text-emerald-500' },
    CLAIM_DENIED: { label: 'Claim denied', icon: 'mdi:close-circle', color: 'text-red-500' },
    MEMBER_JOINED: { label: 'Member joined', icon: 'mdi:account-arrow-right', color: 'text-emerald-500' },
    MEMBER_REMOVED: { label: 'Member removed', icon: 'mdi:account-arrow-left', color: 'text-red-500' },
    ADMIN_ADDED: { label: 'Admin added', icon: 'mdi:shield-account', color: 'text-blue-500' },
    PRIVACY_UPDATED: { label: 'Privacy updated', icon: 'mdi:shield-lock', color: 'text-amber-500' },
    MEDIA_SUBMITTED: { label: 'Media submitted', icon: 'mdi:image-plus', color: 'text-blue-500' },
    MEDIA_APPROVED: { label: 'Media approved', icon: 'mdi:image-check', color: 'text-emerald-500' },
    MEDIA_DENIED: { label: 'Media denied', icon: 'mdi:image-remove', color: 'text-red-500' },
    DATA_IMPORTED: { label: 'Data imported', icon: 'mdi:database-import', color: 'text-blue-500' },
    DATA_EXPORTED: { label: 'Data exported', icon: 'mdi:database-export', color: 'text-blue-500' },
    FAMILY_ARCHIVED: { label: 'Family archived', icon: 'mdi:archive', color: 'text-zinc-500' },
    FAMILY_RESTORED: { label: 'Family restored', icon: 'mdi:archive-arrow-up', color: 'text-emerald-500' },
    UPDATED_RELATIONSHIPS: { label: 'Relationships updated', icon: 'mdi:link-variant', color: 'text-purple-500' },
    ADDED_MARRIAGE: { label: 'Marriage added', icon: 'mdi:heart-plus', color: 'text-pink-500' },
};

const getActionInfo = (actionType: ActionType) => {
    return actionLabels[actionType] || { label: actionType, icon: 'mdi:information', color: 'text-zinc-500' };
};

const formatLogTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getLogDescription = (log: ActivityLog) => {
    const details = log.details || {} as Record<string, any>;
    const parts: string[] = [];

    // Person name from details
    if (details.addedPerson) {
        parts.push(details.addedPerson);
    } else if (details.removedPerson) {
        parts.push(details.removedPerson);
    } else if (details.updatedPerson) {
        parts.push(details.updatedPerson);
    }

    // Relationship context
    if (details.relationship) {
        parts.push(`(${details.relationship})`);
    }

    // Changes detail (from person update)
    if (details.changes && typeof details.changes === 'object') {
        const changes = details.changes as Record<string, { from: any; to: any } | any>;
        const changeList = Object.entries(changes)
            .filter(([_, v]) => v !== undefined)
            .map(([k, v]) => {
                if (v && typeof v === 'object' && 'from' in v && 'to' in v) {
                    return `${k}: ${v.from || '(empty)'} → ${v.to || '(empty)'}`;
                }
                return `${k}: ${v ?? 'removed'}`;
            })
            .join(', ');
        if (changeList) {
            parts.push(`— ${changeList}`);
        }
    }

    // Performer name — use enriched performerName from API if available
    const performerName = (log as any).performerName;
    if (performerName && performerName !== 'Unknown') {
        parts.push(`by ${performerName}`);
    } else if (log.performedBy) {
        parts.push('by user');
    }

    // Reason
    const reason = log.reason || details.reason;
    if (reason) {
        parts.push(`— "${reason}"`);
    }

    return parts.join(' ');
};

const fetchLogs = async () => {
    loading.value = true;
    try {
        logs.value = await getActivities(props.familyId, limit.value);
    } finally {
        loading.value = false;
    }
};

const loadMore = async () => {
    limit.value += 20;
    await fetchLogs();
};

onMounted(fetchLogs);
</script>

<template>
    <div class="mt-4">
        <button
            @click="expanded = !expanded"
            class="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300 hover:text-zinc-800 dark:hover:text-zinc-100 mb-2"
        >
            <Icon icon="mdi:history" class="w-4 h-4" />
            {{ expanded ? 'Hide' : 'Show' }} Audit Log
            <span v-if="logs.length" class="text-xs text-zinc-400">({{ logs.length }})</span>
        </button>

        <div v-if="expanded" class="border dark:border-zinc-700 rounded-md overflow-hidden">
            <div v-if="loading && !logs.length" class="p-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
                Loading audit log...
            </div>

            <div v-else-if="!logs.length" class="p-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
                No activity recorded yet.
            </div>

            <div v-else class="max-h-[400px] overflow-y-auto">
                <div
                    v-for="log in logs"
                    :key="log.id"
                    class="flex items-start gap-3 px-4 py-3 border-b dark:border-zinc-700 last:border-b-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                    <Icon
                        :icon="getActionInfo(log.actionType).icon"
                        :class="['w-4 h-4 mt-0.5 shrink-0', getActionInfo(log.actionType).color]"
                    />
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="text-sm font-medium dark:text-white">
                                {{ getActionInfo(log.actionType).label }}
                            </span>
                            <span class="text-xs text-zinc-400">{{ formatLogTime(log.createdAt) }}</span>
                        </div>
                        <p v-if="getLogDescription(log)" class="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                            {{ getLogDescription(log) }}
                        </p>
                    </div>
                </div>

                <button
                    v-if="logs.length >= limit"
                    @click="loadMore"
                    class="w-full py-2 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                    Load more...
                </button>
            </div>
        </div>
    </div>
</template>
