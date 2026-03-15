<script setup lang="ts">
import type { PersonType, FetchTypeSingle, ViewType, PrivacyControls } from '@/types';
import { getFullName, getGenderLabel } from '@/utils/person';
import { useBannerStore } from '@/stores/useBannerStore';
import { formatDate } from '@/utils/date';
import { Icon } from '@iconify/vue';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { ref, computed, onUnmounted } from 'vue';
import { useRoute } from 'nuxt/app';
import MemberPhotos from '@/components/member/MemberPhotos.vue';

const { isNative } = useDevice();
const route = useRoute();
const router = useRouter();
const bannerStore = useBannerStore();
const authStore = useAuthStore();
const claimsStore = useClaimsStore();
const familyStore = useFamilyStore();
const { profile, user } = storeToRefs(authStore);
const { families } = storeToRefs(familyStore);
const person = ref<PersonType | null>(null);
const isLoading = ref(false);
const { skeletonClasses } = useSkeleton(isLoading);
const showEditModal = ref(false);
const showRoleManagement = ref(false);
const showCreateFamily = ref(false);

const personFamilies = ref<any[]>([]);

const fetchPersonFamilies = async () => {
    if (!person.value) return;
    try {
        const result = await $fetch('/api/get-families-by-person-id', {
            method: 'GET',
            params: { personId: person.value.id },
        }) as any;
        personFamilies.value = result.data || [];
        // Also update the store so other components can use it
        for (const fam of personFamilies.value) {
            familyStore.updateFamilies(fam);
        }
    } catch {
        personFamilies.value = [];
    }
};

// Check if user is owner/admin of any family this person belongs to
const userFamilyRoles = ref<Record<number, string>>({});

const fetchUserFamilyRoles = async () => {
    if (!user.value || !personFamilies.value.length) return;
    for (const fam of personFamilies.value) {
        try {
            const result = await $fetch('/api/roles/get-role', {
                method: 'GET',
                params: { familyId: fam.id },
            }) as any;
            if (result.data?.role) {
                userFamilyRoles.value[fam.id] = result.data.role;
            }
        } catch { /* ignore */ }
    }
};

const handlePersonAdded = async () => {
    if (isNative) {
        await Haptics.impact({ style: ImpactStyle.Medium });
    }
    await refreshPerson();
};

// View management
const currentView = ref<ViewType>('private');
const showPrivacySettings = ref(false);
const showDeleteConfirm = ref(false);
const deleting = ref(false);

const isOwnProfile = computed(() => {
    if (!user.value || !person.value) return false;
    return person.value.claimedBy?.userId === user.value.id
        || (person.value as any).userId === user.value.id
        || (person.value as any).claimedBy === user.value.id
        || (person.value as any).userId === user.value.id;
});

const canEditPerson = computed(() => {
    if (!user.value || !person.value) return false;
    if (isOwnProfile.value) return true;
    return Object.values(userFamilyRoles.value).some(role =>
        ['owner', 'banker', 'admin'].includes(role)
    );
});

const isOwnerOfAnyFamily = computed(() => {
    return Object.values(userFamilyRoles.value).some(role => role === 'owner');
});

const editFamilyId = computed(() => {
    const entry = Object.entries(userFamilyRoles.value).find(([_, role]) =>
        ['owner', 'banker', 'admin'].includes(role)
    );
    return entry ? Number(entry[0]) : undefined;
});

const handlePersonUpdated = async (updatedPerson: any) => {
    person.value = updatedPerson;
    showEditModal.value = false;
    await refreshPerson();
};

const handleFamilyCreated = async (family: any) => {
    showCreateFamily.value = false;
    // Assign owner role
    if (user.value) {
        try {
            await $fetch('/api/roles/assign', {
                method: 'POST',
                body: {
                    familyId: family.id,
                    userId: user.value.id,
                    targetUserId: user.value.id,
                    role: 'owner',
                    isInitialOwner: true,
                },
            });
        } catch { /* role may already exist */ }
    }
    await fetchPersonFamilies();
    await fetchUserFamilyRoles();
};

const availableViews = computed<ViewType[]>(() => {
    if (!isOwnProfile.value) return [];
    const views: ViewType[] = ['private'];
    const privacy = person.value?.privacySettings;
    if (privacy?.familyView) views.push('family');
    if (privacy?.friendsView) views.push('friends');
    if (privacy?.publicView) views.push('public');
    return views;
});

const personId = computed(() => Number(route.params.personId));

const { data: fetchedPerson, status: fetchStatus, refresh: refreshPerson } = useAsyncData(
    `person-${route.params.personId}`,
    async () => {
        if (!personId.value) return null;

        // Use privacy-aware endpoint if we have a viewer and it's not own profile
        if (user.value) {
            const response = await $fetch<FetchTypeSingle<PersonType>>('/api/person/profile-view', {
                method: 'GET',
                params: {
                    personId: personId.value,
                },
            });
            return response.data ?? null;
        } else {
            const response = await $fetch<FetchTypeSingle<PersonType>>('/api/get-person-by-id', {
                method: 'GET',
                params: {
                    select: '*',
                    id: personId.value,
                },
            });
            return response.data ?? null;
        }
    },
    { watch: [personId] }
);

watchEffect(() => {
    person.value = fetchedPerson.value ?? null;
    isLoading.value = fetchStatus.value === 'pending';
});

const fetchPerson = () => refreshPerson();

const setBanner = () => {
    bannerStore.setBannerInfo(
        'Person Details',
        `Viewing details for ${getFullName(person.value)}`
    );
}

const handleDeleteProfile = async () => {
    if (!user.value || !person.value) return;
    deleting.value = true;

    try {
        const result = await $fetch('/api/person/delete-profile', {
            method: 'POST',
            body: {
                personId: person.value.id,
                userId: user.value.id,
            },
        }) as any;

        if (result.success) {
            showDeleteConfirm.value = false;
            authStore.signOut();
        }
    } catch (err) {
        console.error('Failed to delete profile:', err);
    } finally {
        deleting.value = false;
    }
};

const handlePrivacyUpdated = (settings: PrivacyControls) => {
    if (person.value) {
        person.value.privacySettings = settings;
    }
};

// Watch for route param changes
watch(() => route.params.personId, () => {
    if (profile.value && profile.value.id === Number(route.params.personId)) {
        person.value = profile.value;
    } else {
        fetchPerson();
    }
    setBanner();
});

// Initial fetch
onMounted(async () => {
    if (!profile.value || (profile.value && profile.value.id !== Number(route.params.personId))) {
        await fetchPerson();
    } else {
        person.value = profile.value;
    }
    setBanner();

    // Load families this person belongs to
    await fetchPersonFamilies();

    // Load claims/memberships for authenticated user
    if (user.value) {
        await claimsStore.fetchMyClaims(user.value.id);
        await claimsStore.fetchMyMemberships(user.value.id);
        await fetchUserFamilyRoles();
    }
});

onUnmounted(() => {
    bannerStore.clearBannerInfo();
});
</script>

<template>
    <div class="min-h-screen w-full p-4 text-zinc-950 dark:text-zinc-50">
        <div class="min-h-screen w-full p-4 text-zinc-950 dark:text-zinc-50">

            <!-- Header with avatar and name -->
            <div class="w-full flex justify-center my-3 p-2 gap-2 items-center">
                <MemberAvatar :person="person" :class="[skeletonClasses]" />
                <h1 :class="['font-extralight text-4xl min-w-40 min-h-12', skeletonClasses]">{{ getFullName(person) }}</h1>
                <button
                    v-if="canEditPerson && person"
                    @click="showEditModal = true"
                    class="ml-2 p-2 border dark:border-zinc-600 rounded-md text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    title="Edit details"
                >
                    <Icon icon="mdi:pencil" class="w-5 h-5" />
                </button>
            </div>

            <!-- View Toggle (only for own profile) -->
            <div v-if="isOwnProfile" class="flex justify-center mb-6">
                <MemberProfileViewToggle
                    :current-view="currentView"
                    :is-own-profile="isOwnProfile"
                    :available-views="availableViews"
                    @change-view="(v) => currentView = v"
                />
            </div>

            <!-- ==================== PRIVATE VIEW ==================== -->
            <template v-if="currentView === 'private' || !isOwnProfile">
                <!-- Photos and Families -->
                <div class="flex w-full items-end grid-cols-2 gap-4 mb-4">
                    <MemberPhotos :person="person" />
                    <MemberFamiliesCreatedByMember :person="person" />
                </div>

                <!-- Family Trees this person belongs to -->
                <div v-if="person && personFamilies.length" class="mb-6">
                    <h2 class="font-semibold mb-3">Family Trees</h2>
                    <div class="flex flex-wrap gap-3">
                        <NuxtLink
                            v-for="fam in personFamilies"
                            :key="fam.id"
                            :to="{ name: 'member-personId-tree-familyId', params: { personId: person.id, familyId: fam.id } }"
                            class="flex items-center gap-2 p-3 border dark:border-zinc-700 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            <Icon icon="mdi:family-tree" class="w-5 h-5 text-emerald-600" />
                            <span class="text-sm font-medium dark:text-zinc-200">{{ fam.familyName }} Tree</span>
                            <Icon icon="mdi:arrow-right" class="w-4 h-4 text-zinc-400" />
                        </NuxtLink>
                    </div>
                </div>

                <!-- Create Family Tree (when person has no families) -->
                <div v-if="isOwnProfile && person && !personFamilies.length && !isLoading" class="mb-6">
                    <div v-if="!showCreateFamily" class="p-6 border border-dashed dark:border-zinc-600 rounded-md text-center">
                        <Icon icon="mdi:family-tree" class="w-10 h-10 mx-auto text-zinc-400 mb-2" />
                        <p class="text-zinc-600 dark:text-zinc-300 mb-3">You're not part of any family tree yet.</p>
                        <button
                            @click="showCreateFamily = true"
                            class="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors font-medium text-sm"
                        >
                            Create a Family Tree
                        </button>
                    </div>
                    <FamilyCreateFamilyForm
                        v-else
                        @created="handleFamilyCreated"
                    />
                </div>

                <!-- Personal Information -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div class="p-4 rounded-md border dark:border-zinc-700">
                        <h2 class="font-semibold mb-2">Personal Information</h2>
                        <p><span class="font-medium">Gender:</span> {{ getGenderLabel(person?.gender) }}</p>
                        <p>
                            <span class="font-medium">Birth Date:</span> {{ formatDate(person?.birthDate) }}
                        </p>
                        <p v-if="!person?.isLiving">
                            <span class="font-medium">Death Date:</span> {{ formatDate(person?.deathDate) }}
                        </p>
                    </div>

                    <!-- Extended info (visible to profile owner in private view, or to family admins/owners) -->
                    <div v-if="(isOwnProfile || canEditPerson) && person?.extendedInfo" class="p-4 rounded-md border dark:border-zinc-700">
                        <h2 class="font-semibold mb-2">Additional Details</h2>
                        <template v-if="person.extendedInfo">
                            <p v-if="(person.extendedInfo as any).email">
                                <span class="font-medium">Email:</span> {{ (person.extendedInfo as any).email }}
                            </p>
                            <p v-if="(person.extendedInfo as any).phone">
                                <span class="font-medium">Phone:</span> {{ (person.extendedInfo as any).phone }}
                            </p>
                            <p v-if="(person.extendedInfo as any).occupation">
                                <span class="font-medium">Occupation:</span> {{ (person.extendedInfo as any).occupation }}
                            </p>
                            <p v-if="(person.extendedInfo as any).address">
                                <span class="font-medium">Address:</span> {{ (person.extendedInfo as any).address }}
                            </p>
                        </template>
                        <p v-else class="text-zinc-500 dark:text-zinc-400 text-sm">
                            No additional details yet. Add them below.
                        </p>
                    </div>
                </div>

                <!-- Add Person to Family Trees -->
                <div v-if="user && personFamilies.length" class="mb-6">
                    <h2 class="font-semibold mb-3">Add a Family Member</h2>
                    <div class="flex flex-wrap gap-3">
                        <div v-for="fam in personFamilies" :key="fam.id" class="flex items-center gap-2 p-3 border dark:border-zinc-700 rounded-md">
                            <span class="text-sm dark:text-zinc-300">{{ fam.familyName }} Tree:</span>
                            <FamilyAddPersonToTree
                                :family-id="fam.id"
                                :parent-person="person"
                                size="sm"
                                @person-added="handlePersonAdded"
                            />
                        </div>
                    </div>
                </div>

                <!-- Role Management (owner only) -->
                <div v-if="isOwnerOfAnyFamily && personFamilies.length" class="mb-6">
                    <button
                        @click="showRoleManagement = !showRoleManagement"
                        class="w-full flex items-center justify-between gap-2 p-3 rounded-md border dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <span class="flex items-center gap-2 font-medium text-sm">
                            <Icon icon="mdi:shield-account" class="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
                            Role Management
                        </span>
                        <Icon :icon="showRoleManagement ? 'mdi:chevron-up' : 'mdi:chevron-down'" class="w-5 h-5 text-zinc-400" />
                    </button>
                    <div v-if="showRoleManagement" class="mt-2">
                        <FamilyRoleManagement
                            v-for="fam in personFamilies.filter(f => userFamilyRoles[f.id] === 'owner')"
                            :key="fam.id"
                            :family-id="fam.id"
                            class="mb-3"
                        />
                    </div>
                </div>

                <!-- My Claims Panel (for authenticated users viewing their own profile) -->
                <div v-if="isOwnProfile" class="mb-6">
                    <MemberMyClaimsPanel />
                </div>

                <!-- Privacy Settings (own profile, private view) -->
                <div v-if="isOwnProfile" class="mb-6">
                    <button
                        @click="showPrivacySettings = !showPrivacySettings"
                        class="w-full flex items-center justify-between gap-2 p-3 rounded-md border dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <span class="flex items-center gap-2 font-medium text-sm">
                            <Icon icon="mdi:shield-lock" class="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
                            Privacy Settings
                        </span>
                        <Icon :icon="showPrivacySettings ? 'mdi:chevron-up' : 'mdi:chevron-down'" class="w-5 h-5 text-zinc-400" />
                    </button>
                    <MemberPrivacySettingsPanel
                        v-if="showPrivacySettings && person"
                        class="mt-2"
                        :person-id="person.id"
                        :current-settings="person.privacySettings || { familyView: true, friendsView: false, publicView: false, timeBasedRules: [], ageRestrictions: null, requireSameLastName: false }"
                        @updated="handlePrivacyUpdated"
                    />
                </div>

                <!-- Delete Profile (own profile, private view) -->
                <div v-if="isOwnProfile" class="mb-6">
                    <button
                        @click="showDeleteConfirm = true"
                        class="text-sm text-red-500 hover:text-red-700 dark:hover:text-red-300 underline"
                    >
                        Delete my profile
                    </button>

                    <!-- Delete confirmation modal -->
                    <div v-if="showDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="showDeleteConfirm = false">
                        <div class="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-sm w-full mx-4 p-6">
                            <h3 class="text-lg font-semibold dark:text-white mb-3">Delete Profile?</h3>
                            <p class="text-sm text-zinc-600 dark:text-zinc-300 mb-2">
                                This will permanently remove your personal details. Only your first and last name will remain visible in family trees.
                            </p>
                            <p class="text-sm text-red-500 mb-4">
                                This action cannot be undone. Nobody will be able to re-add your details.
                            </p>
                            <div class="flex gap-2">
                                <button
                                    @click="showDeleteConfirm = false"
                                    class="flex-1 px-4 py-2 border dark:border-zinc-600 rounded-md text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    @click="handleDeleteProfile"
                                    :disabled="deleting"
                                    class="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                                >
                                    {{ deleting ? 'Deleting...' : 'Delete' }}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </template>

            <!-- ==================== FAMILY VIEW ==================== -->
            <template v-else-if="currentView === 'family'">
                <!-- Family Trees overview with member counts -->
                <div v-if="person && personFamilies.length" class="mb-8">
                    <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Icon icon="mdi:family-tree" class="w-5 h-5 text-emerald-600" />
                        My Family Trees
                    </h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <NuxtLink
                            v-for="fam in personFamilies"
                            :key="fam.id"
                            :to="{ name: 'member-personId-tree-familyId', params: { personId: person.id, familyId: fam.id } }"
                            class="group p-5 border dark:border-zinc-700 rounded-lg hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md transition-all"
                        >
                            <div class="flex items-start justify-between mb-3">
                                <div>
                                    <h3 class="font-semibold text-base group-hover:text-emerald-600 transition-colors">{{ fam.familyName }} Tree</h3>
                                    <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Created {{ formatDate(fam.createdAt) }}</p>
                                </div>
                                <span class="text-xs px-2 py-0.5 rounded-full capitalize" :class="fam.visibility === 'public' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'">
                                    {{ fam.visibility }}
                                </span>
                            </div>
                            <div class="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-300">
                                <span class="flex items-center gap-1">
                                    <Icon icon="mdi:account-multiple" class="w-4 h-4" />
                                    {{ (fam.members || []).length }} members
                                </span>
                                <span v-if="userFamilyRoles[fam.id]" class="flex items-center gap-1">
                                    <Icon icon="mdi:shield-account" class="w-4 h-4" />
                                    {{ userFamilyRoles[fam.id] }}
                                </span>
                            </div>
                            <div class="mt-3 flex items-center text-xs text-emerald-600 dark:text-emerald-400 font-medium group-hover:translate-x-1 transition-transform">
                                View Tree
                                <Icon icon="mdi:arrow-right" class="w-3 h-3 ml-1" />
                            </div>
                        </NuxtLink>
                    </div>
                </div>

                <!-- Quick actions for family -->
                <div class="mb-8">
                    <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Icon icon="mdi:lightning-bolt" class="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
                        Quick Actions
                    </h2>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <!-- Add family member -->
                        <div v-for="fam in personFamilies" :key="`add-${fam.id}`" class="flex items-center justify-between gap-2 p-4 border dark:border-zinc-700 rounded-lg">
                            <div>
                                <p class="text-sm font-medium">Add to {{ fam.familyName }}</p>
                                <p class="text-xs text-zinc-500 dark:text-zinc-400">Add a new family member</p>
                            </div>
                            <FamilyAddPersonToTree
                                :family-id="fam.id"
                                :parent-person="person"
                                size="sm"
                                @person-added="handlePersonAdded"
                            />
                        </div>

                        <!-- Create new tree -->
                        <div v-if="isOwnProfile" class="flex items-center justify-between gap-2 p-4 border border-dashed dark:border-zinc-600 rounded-lg">
                            <div>
                                <p class="text-sm font-medium">New Tree</p>
                                <p class="text-xs text-zinc-500 dark:text-zinc-400">Start a new family tree</p>
                            </div>
                            <button
                                @click="showCreateFamily = true"
                                class="px-3 py-1.5 text-xs bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors font-medium"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                    <FamilyCreateFamilyForm
                        v-if="showCreateFamily"
                        class="mt-4"
                        @created="handleFamilyCreated"
                    />
                </div>

                <!-- Role management (owner only) -->
                <div v-if="isOwnerOfAnyFamily && personFamilies.length" class="mb-8">
                    <FamilyRoleManagement
                        v-for="fam in personFamilies.filter(f => userFamilyRoles[f.id] === 'owner')"
                        :key="fam.id"
                        :family-id="fam.id"
                        class="mb-3"
                    />
                </div>

                <!-- Claims -->
                <div class="mb-8">
                    <MemberMyClaimsPanel />
                </div>
            </template>
        </div>

        <div v-if="!person && !isLoading" class="text-center py-8">
            <p class="text-gray-600">Person not found</p>
        </div>

        <!-- Edit Person Modal -->
        <MemberEditPersonDetails
            v-if="showEditModal && person"
            :person="person"
            :family-id="editFamilyId"
            @updated="handlePersonUpdated"
            @close="showEditModal = false"
        />
    </div>
</template>
