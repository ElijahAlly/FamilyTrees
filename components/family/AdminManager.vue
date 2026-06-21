<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Icon } from '@iconify/vue';

const props = defineProps<{
    familyId: number;
}>();

const authStore = useAuthStore();
const claimsStore = useClaimsStore();
const { user } = storeToRefs(authStore);

const members = ref<any[]>([]);
const loadingMembers = ref(false);
const actionLoading = ref<string | null>(null);
const confirmAction = ref<{ action: string; targetUserId: string; targetName: string } | null>(null);
const successMessage = ref('');

const loadMembers = async () => {
    if (!user.value) return;
    loadingMembers.value = true;
    members.value = await claimsStore.fetchFamilyMembers(props.familyId, user.value.id);
    loadingMembers.value = false;
};

const handleAction = async (action: 'add_admin' | 'remove_admin' | 'transfer_admin', targetUserId: string) => {
    if (!user.value) return;

    actionLoading.value = targetUserId;
    successMessage.value = '';

    const result = await claimsStore.manageAdmin({
        familyId: props.familyId,
        userId: user.value.id,
        action,
        targetUserId,
    });

    actionLoading.value = null;
    confirmAction.value = null;

    if (result) {
        const actionLabels = {
            add_admin: 'added as admin',
            remove_admin: 'removed as admin',
            transfer_admin: 'Admin rights transferred',
        };
        successMessage.value = actionLabels[action];
        setTimeout(() => successMessage.value = '', 3000);
        await loadMembers();
    }
};

const promptConfirm = (action: string, targetUserId: string, targetName: string) => {
    confirmAction.value = { action, targetUserId, targetName };
};

onMounted(loadMembers);
</script>

<template>
    <div class="w-full p-4 border dark:border-zinc-700 rounded-lg">
        <h3 class="text-lg font-semibold dark:text-white mb-4 flex items-center gap-2">
            <Icon icon="mdi:shield-account" class="w-5 h-5" />
            Admin Management
        </h3>

        <!-- Success message -->
        <div v-if="successMessage" class="mb-3 p-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded text-sm">
            {{ successMessage }}
        </div>

        <!-- Error message -->
        <div v-if="claimsStore.error" class="mb-3 p-2 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded text-sm">
            {{ claimsStore.error }}
        </div>

        <!-- Confirmation dialog -->
        <div v-if="confirmAction" class="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
            <p class="text-sm dark:text-white mb-2">
                <template v-if="confirmAction.action === 'transfer_admin'">
                    Transfer your admin rights to <strong>{{ confirmAction.targetName }}</strong>? You will no longer be an admin.
                </template>
                <template v-else-if="confirmAction.action === 'remove_admin'">
                    Remove admin rights from <strong>{{ confirmAction.targetName }}</strong>?
                </template>
                <template v-else>
                    Make <strong>{{ confirmAction.targetName }}</strong> an admin?
                </template>
            </p>
            <div class="flex gap-2">
                <button
                    @click="handleAction(confirmAction.action as any, confirmAction.targetUserId)"
                    :disabled="actionLoading !== null"
                    class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    Confirm
                </button>
                <button
                    @click="confirmAction = null"
                    class="px-3 py-1 text-sm border dark:border-zinc-600 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:text-white"
                >
                    Cancel
                </button>
            </div>
        </div>

        <!-- Loading state -->
        <div v-if="loadingMembers" class="text-sm text-zinc-500 dark:text-zinc-400">
            Loading members...
        </div>

        <!-- Members list -->
        <div v-else class="space-y-2">
            <div v-if="members.length === 0" class="text-sm text-zinc-500 dark:text-zinc-400">
                No active members found.
            </div>

            <div
                v-for="member in members"
                :key="member.userId"
                class="flex items-center justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50"
            >
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium dark:text-white truncate">
                        {{ member.personName || member.email }}
                        <span v-if="member.userId === user?.id" class="text-xs text-zinc-500">(you)</span>
                    </p>
                    <p v-if="member.personName" class="text-xs text-zinc-500 dark:text-zinc-400 truncate">{{ member.email }}</p>
                    <span
                        v-if="member.isAdmin"
                        class="inline-block mt-1 text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded"
                    >
                        Admin
                    </span>
                </div>

                <div v-if="member.userId !== user?.id" class="flex gap-1 shrink-0 ml-2">
                    <button
                        v-if="!member.isAdmin"
                        @click="promptConfirm('add_admin', member.userId, member.personName || member.email)"
                        :disabled="actionLoading !== null"
                        class="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        title="Make admin"
                    >
                        <Icon icon="mdi:shield-plus" class="w-4 h-4" />
                    </button>
                    <button
                        v-if="member.isAdmin"
                        @click="promptConfirm('remove_admin', member.userId, member.personName || member.email)"
                        :disabled="actionLoading !== null"
                        class="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                        title="Remove admin"
                    >
                        <Icon icon="mdi:shield-remove" class="w-4 h-4" />
                    </button>
                    <button
                        v-if="!member.isAdmin"
                        @click="promptConfirm('transfer_admin', member.userId, member.personName || member.email)"
                        :disabled="actionLoading !== null"
                        class="px-2 py-1 text-xs bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50"
                        title="Transfer admin rights"
                    >
                        <Icon icon="mdi:swap-horizontal" class="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
