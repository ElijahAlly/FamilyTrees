<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import type { FamilyType, PersonType } from '@/types';

const authStore = useAuthStore();
const claimsStore = useClaimsStore();
const { profile, user } = storeToRefs(authStore);
const router = useRouter();

type OnboardingStep = 'search' | 'results' | 'claim' | 'create' | 'profile' | 'complete';

const step = ref<OnboardingStep>('search');
const loading = ref(false);
const matchingFamilies = ref<FamilyType[]>([]);
const selectedFamily = ref<FamilyType | null>(null);
const familyMembers = ref<any[]>([]);
const createdFamily = ref<FamilyType | null>(null);

// Profile fields
const birthDate = ref('');
const gender = ref<'M' | 'F' | 'N' | 'U'>('U');

const userFirstName = computed(() => profile.value?.firstName || '');
const userLastName = computed(() => profile.value?.lastName || '');

// Search for matching families by last name
const searchFamilies = async () => {
    if (!userLastName.value) {
        step.value = 'create';
        return;
    }

    loading.value = true;
    try {
        const { data } = await $fetch('/api/onboarding/search-families', {
            method: 'GET',
            params: { lastName: userLastName.value },
        }) as any;

        matchingFamilies.value = data || [];

        if (matchingFamilies.value.length > 0) {
            step.value = 'results';
        } else {
            step.value = 'create';
        }
    } catch (err) {
        console.error('Error searching families:', err);
        step.value = 'create';
    } finally {
        loading.value = false;
    }
};

// User selected a family to claim into
const selectFamily = async (family: FamilyType) => {
    selectedFamily.value = family;
    loading.value = true;
    try {
        const { data } = await $fetch('/api/onboarding/get-family-members', {
            method: 'GET',
            params: { familyId: family.id },
        }) as any;

        familyMembers.value = data || [];
        step.value = 'claim';
    } catch (err) {
        console.error('Error fetching family members:', err);
    } finally {
        loading.value = false;
    }
};

// User claims themselves as an existing person in the tree
const claimPerson = async (person: any) => {
    if (!user.value || !selectedFamily.value) return;
    loading.value = true;
    try {
        await claimsStore.submitClaim({
            type: 'claim_person',
            requesterId: user.value.id,
            personId: person.id,
            familyId: selectedFamily.value.id,
            message: 'Claiming during onboarding',
        });
        step.value = 'profile';
    } catch (err) {
        console.error('Error claiming person:', err);
    } finally {
        loading.value = false;
    }
};

// User says "I'm not listed" - add self to family
const addSelfToFamily = async () => {
    if (!user.value || !selectedFamily.value) return;
    loading.value = true;
    try {
        await claimsStore.submitClaim({
            type: 'add_self_to_family',
            requesterId: user.value.id,
            familyId: selectedFamily.value.id,
            message: 'Requesting to join during onboarding',
        });
        step.value = 'profile';
    } catch (err) {
        console.error('Error adding self to family:', err);
    } finally {
        loading.value = false;
    }
};

// Create a new family tree (user is first in their family)
const createNewTree = async () => {
    if (!user.value || !profile.value) return;
    loading.value = true;
    try {
        const result = await claimsStore.createFamily({
            familyName: userLastName.value || 'My Family',
            userId: user.value.id,
            visibility: 'private',
            personId: profile.value.id,
        });

        if (result) {
            createdFamily.value = result;

            // Also create owner role for this family
            await $fetch('/api/roles/assign', {
                method: 'POST',
                body: {
                    familyId: result.id,
                    userId: user.value.id,
                    targetUserId: user.value.id,
                    role: 'owner',
                    isInitialOwner: true,
                },
            }).catch(() => {
                // Role API may not exist yet during migration, that's ok
            });
        }

        step.value = 'profile';
    } catch (err) {
        console.error('Error creating family:', err);
    } finally {
        loading.value = false;
    }
};

// Complete onboarding
const completeOnboarding = async () => {
    if (!user.value || !profile.value) return;
    loading.value = true;
    try {
        await $fetch('/api/onboarding/complete', {
            method: 'POST',
            body: {
                userId: user.value.id,
                personId: profile.value.id,
                birthDate: birthDate.value || null,
                gender: gender.value !== 'U' ? gender.value : null,
            },
        });

        // Refresh profile
        await authStore.getProfile();

        // Navigate to profile
        router.replace({
            name: 'member-personId',
            params: { personId: `${profile.value.id}` },
        });
    } catch (err) {
        console.error('Error completing onboarding:', err);
    } finally {
        loading.value = false;
    }
};

const skipToProfile = () => {
    step.value = 'profile';
};

onMounted(async () => {
    // Redirect if not authenticated
    if (!user.value) {
        router.replace('/signup');
        return;
    }

    // Load profile if needed
    if (!profile.value) {
        await authStore.getProfile();
    }

    // If no person record exists, create one
    if (!profile.value && user.value) {
        try {
            const result = await $fetch('/api/onboarding/ensure-profile', {
                method: 'POST',
                body: {
                    firstName: user.value.email.split('@')[0],
                    lastName: '',
                },
            }) as any;
            if (result.data) {
                profile.value = result.data;
            }
        } catch (err) {
            console.error('Error creating profile:', err);
        }
    }

    // If already completed onboarding, go to profile
    if (profile.value && (profile.value as any).onboardingCompleted) {
        router.replace({
            name: 'member-personId',
            params: { personId: `${profile.value.id}` },
        });
        return;
    }

    // Start searching
    searchFamilies();
});
</script>

<template>
    <section class="w-full min-h-screen flex justify-center pt-24 px-4">
        <div class="w-full max-w-xl">
            <!-- Search Step -->
            <div v-if="step === 'search'" class="text-center">
                <h1 class="text-3xl font-extralight dark:text-white mb-4">
                    Welcome, {{ userFirstName }}!
                </h1>
                <p class="text-zinc-600 dark:text-zinc-300 mb-6">
                    Let's see if your family is already on MyTrees.family...
                </p>
                <div class="flex justify-center">
                    <Icon icon="mdi:loading" class="w-8 h-8 animate-spin text-emerald-600" />
                </div>
            </div>

            <!-- Results Step -->
            <div v-if="step === 'results'" class="space-y-4">
                <h1 class="text-2xl font-extralight dark:text-white mb-2">
                    We found {{ matchingFamilies.length }} matching {{ matchingFamilies.length === 1 ? 'family' : 'families' }}!
                </h1>
                <p class="text-zinc-600 dark:text-zinc-300 mb-4">
                    Is one of these your family?
                </p>

                <div class="space-y-3">
                    <button
                        v-for="family in matchingFamilies"
                        :key="family.id"
                        @click="selectFamily(family)"
                        class="w-full text-left p-4 border dark:border-zinc-600 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="font-medium dark:text-white">The {{ family.familyName }} Family</p>
                                <p class="text-sm text-zinc-500 dark:text-zinc-400">
                                    {{ family.members?.length || 0 }} member{{ (family.members?.length || 0) !== 1 ? 's' : '' }}
                                </p>
                            </div>
                            <Icon icon="mdi:chevron-right" class="w-5 h-5 text-zinc-400" />
                        </div>
                    </button>
                </div>

                <button
                    @click="step = 'create'"
                    class="w-full mt-4 p-3 text-zinc-600 dark:text-zinc-300 border border-dashed dark:border-zinc-600 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-sm"
                >
                    None of these are my family — Create a new tree
                </button>
            </div>

            <!-- Claim Step -->
            <div v-if="step === 'claim' && selectedFamily" class="space-y-4">
                <h1 class="text-2xl font-extralight dark:text-white mb-2">
                    The {{ selectedFamily.familyName }} Family
                </h1>
                <p class="text-zinc-600 dark:text-zinc-300 mb-4">
                    Find yourself in the tree and claim your spot:
                </p>

                <div v-if="loading" class="flex justify-center py-6">
                    <Icon icon="mdi:loading" class="w-8 h-8 animate-spin text-emerald-600" />
                </div>

                <div v-else class="space-y-2">
                    <button
                        v-for="member in familyMembers"
                        :key="member.id"
                        @click="claimPerson(member)"
                        :disabled="!!member.claimedBy"
                        class="w-full text-left p-3 border dark:border-zinc-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        :class="member.claimedBy ? '' : 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-500'"
                    >
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="font-medium dark:text-white">
                                    {{ member.firstName }} {{ member.lastName }}
                                </p>
                                <p v-if="member.birthDate" class="text-xs text-zinc-500">
                                    Born: {{ member.birthDate }}
                                </p>
                            </div>
                            <span v-if="member.claimedBy" class="text-xs text-zinc-400 flex items-center gap-1">
                                <Icon icon="mdi:check-circle" class="w-3 h-3 text-emerald-500" />
                                Claimed
                            </span>
                            <span v-else class="text-xs text-emerald-600 font-medium">
                                This is me
                            </span>
                        </div>
                    </button>
                </div>

                <button
                    @click="addSelfToFamily"
                    class="w-full mt-3 p-3 text-zinc-600 dark:text-zinc-300 border border-dashed dark:border-zinc-600 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-sm"
                >
                    I'm not listed here — Request to join this family
                </button>

                <button
                    @click="step = 'results'"
                    class="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                >
                    &larr; Back to results
                </button>
            </div>

            <!-- Create Step -->
            <div v-if="step === 'create'" class="text-center space-y-4">
                <Icon icon="mdi:tree" class="w-16 h-16 mx-auto text-emerald-600" />
                <h1 class="text-2xl font-extralight dark:text-white">
                    You're the first {{ userLastName || '' }} here!
                </h1>
                <p class="text-zinc-600 dark:text-zinc-300">
                    Let's create your family tree. You'll be the owner and can invite your family members.
                </p>

                <button
                    @click="createNewTree"
                    :disabled="loading"
                    class="px-6 py-3 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 transition-colors font-medium"
                >
                    <span v-if="loading" class="flex items-center gap-2">
                        <Icon icon="mdi:loading" class="w-4 h-4 animate-spin" />
                        Creating...
                    </span>
                    <span v-else>Create The {{ userLastName || 'My' }} Family Tree</span>
                </button>

                <button
                    v-if="matchingFamilies.length > 0"
                    @click="step = 'results'"
                    class="block mx-auto text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                >
                    &larr; Back to matching families
                </button>
            </div>

            <!-- Profile Step -->
            <div v-if="step === 'profile'" class="space-y-4">
                <h1 class="text-2xl font-extralight dark:text-white mb-2">
                    Almost done!
                </h1>
                <p class="text-zinc-600 dark:text-zinc-300 mb-4">
                    Add a few details to your profile. You can always update these later.
                </p>

                <div>
                    <label class="block text-sm font-medium dark:text-zinc-300 mb-1">Birth Date</label>
                    <input
                        v-model="birthDate"
                        type="date"
                        class="w-full px-3 py-2 border dark:border-zinc-600 rounded-md bg-transparent dark:text-white text-sm outline-none focus:border-emerald-500"
                    />
                </div>

                <div>
                    <label class="block text-sm font-medium dark:text-zinc-300 mb-1">Gender</label>
                    <select
                        v-model="gender"
                        class="w-full px-3 py-2 border dark:border-zinc-600 rounded-md bg-transparent dark:text-white text-sm outline-none"
                    >
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                        <option value="N">Non-binary</option>
                        <option value="U">Prefer not to say</option>
                    </select>
                </div>

                <div class="flex gap-3 pt-4">
                    <button
                        @click="completeOnboarding"
                        :disabled="loading"
                        class="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                    >
                        {{ loading ? 'Finishing...' : 'Complete Setup' }}
                    </button>
                    <button
                        @click="completeOnboarding"
                        class="px-4 py-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors text-sm"
                    >
                        Skip for now
                    </button>
                </div>
            </div>
        </div>
    </section>
</template>
