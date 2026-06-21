<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import type { FamilyRole } from '@/types/roles';

const props = defineProps<{
    familyId: number;
}>();

const authStore = useAuthStore();
const { user } = storeToRefs(authStore);
const claimsStore = useClaimsStore();

const members = ref<any[]>([]);
const roles = ref<Record<string, FamilyRole>>({});
const loading = ref(false);
const error = ref('');
const actionLoading = ref<string | null>(null);

const ROLE_LABELS: Record<FamilyRole, string> = {
    owner: 'Owner',
    banker: 'Banker',
    admin: 'Admin',
    member: 'Member',
    guest: 'Guest',
};

const ROLE_COLORS: Record<FamilyRole, string> = {
    owner: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    banker: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    admin: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    member: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200',
    guest: 'bg-zinc-50 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
};

const currentUserRole = computed(() => {
    if (!user.value) return null;
    return roles.value[user.value.id] || null;
});

const isCurrentUserOwner = computed(() => currentUserRole.value === 'owner');

const fetchMembers = async () => {
    loading.value = true;
    try {
        const memberData = await claimsStore.fetchFamilyMembers(props.familyId, user.value?.id || '');
        members.value = memberData || [];

        // Fetch roles for all members
        for (const member of members.value) {
            if (member.userId) {
                try {
                    const { data } = await $fetch('/api/roles/get-role', {
                        method: 'GET',
                        params: { userId: member.userId, familyId: props.familyId },
                    }) as any;
                    if (data) {
                        roles.value[member.userId] = data.role;
                    }
                } catch {
                    // Ignore individual role fetch errors
                }
            }
        }
    } catch (err) {
        console.error('Error fetching members:', err);
    } finally {
        loading.value = false;
    }
};

const assignRole = async (targetUserId: string, role: FamilyRole) => {
    if (!user.value) return;
    actionLoading.value = targetUserId;
    error.value = '';

    try {
        const result = await $fetch('/api/roles/assign', {
            method: 'POST',
            body: {
                familyId: props.familyId,
                userId: user.value.id,
                targetUserId,
                role,
            },
        }) as any;

        if (!result.success) {
            error.value = result.error;
            return;
        }

        roles.value[targetUserId] = role;
    } catch (err: any) {
        error.value = err.message || 'Failed to assign role';
    } finally {
        actionLoading.value = null;
    }
};

const transferOwnership = async (targetUserId: string) => {
    if (!user.value || !confirm('Are you sure you want to transfer ownership? You will become an admin.')) return;

    actionLoading.value = targetUserId;
    error.value = '';

    try {
        const result = await $fetch('/api/roles/transfer-ownership', {
            method: 'POST',
            body: {
                familyId: props.familyId,
                currentOwnerId: user.value.id,
                newOwnerId: targetUserId,
            },
        }) as any;

        if (!result.success) {
            error.value = result.error;
            return;
        }

        roles.value[user.value.id] = 'admin';
        roles.value[targetUserId] = 'owner';
    } catch (err: any) {
        error.value = err.message || 'Failed to transfer ownership';
    } finally {
        actionLoading.value = null;
    }
};

const getAssignableRoles = (targetUserId: string): FamilyRole[] => {
    const targetRole = roles.value[targetUserId];
    const options: FamilyRole[] = [];

    if (isCurrentUserOwner.value) {
        if (targetRole !== 'banker') options.push('banker');
        if (targetRole !== 'admin') options.push('admin');
        if (targetRole !== 'member') options.push('member');
    } else if (currentUserRole.value === 'admin') {
        // Admins can only promote to admin (not demote other admins)
        if (targetRole === 'member') options.push('admin');
    }

    return options;
};

onMounted(fetchMembers);
</script>

<template>
    <div class="p-4 border dark:border-zinc-700 rounded-md">
        <h3 class="font-semibold dark:text-white mb-3 flex items-center gap-2">
            <Icon icon="mdi:shield-account" class="w-5 h-5" />
            Role Management
        </h3>

        <p v-if="error" class="text-sm text-red-500 mb-2">{{ error }}</p>

        <div v-if="loading" class="text-sm text-zinc-500 dark:text-zinc-400">Loading members...</div>

        <div v-else class="space-y-2">
            <div
                v-for="member in members"
                :key="member.id"
                class="flex items-center justify-between p-2 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
            >
                <div class="flex items-center gap-2">
                    <span class="text-sm dark:text-white">
                        {{ member.firstName }} {{ member.lastName }}
                    </span>
                    <span
                        v-if="member.userId && roles[member.userId]"
                        :class="['text-xs px-2 py-0.5 rounded-full', ROLE_COLORS[roles[member.userId]]]"
                    >
                        {{ ROLE_LABELS[roles[member.userId]] }}
                    </span>
                </div>

                <div v-if="member.userId && member.userId !== user?.id" class="flex items-center gap-1">
                    <!-- Role assignment buttons -->
                    <button
                        v-for="role in getAssignableRoles(member.userId)"
                        :key="role"
                        @click="assignRole(member.userId, role)"
                        :disabled="actionLoading === member.userId"
                        class="text-xs px-2 py-1 border dark:border-zinc-600 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 dark:text-zinc-300 transition-colors disabled:opacity-50"
                    >
                        {{ role === 'admin' ? 'Make Admin' : role === 'banker' ? 'Make Banker' : `Set ${ROLE_LABELS[role]}` }}
                    </button>

                    <!-- Transfer ownership (owner only) -->
                    <button
                        v-if="isCurrentUserOwner && roles[member.userId] !== 'owner'"
                        @click="transferOwnership(member.userId)"
                        :disabled="actionLoading === member.userId"
                        class="text-xs px-2 py-1 border border-amber-300 dark:border-amber-600 text-amber-600 dark:text-amber-400 rounded hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors disabled:opacity-50"
                    >
                        Transfer Ownership
                    </button>
                </div>

                <span v-if="member.userId === user?.id" class="text-xs text-zinc-400">(you)</span>
            </div>
        </div>
    </div>
</template>
