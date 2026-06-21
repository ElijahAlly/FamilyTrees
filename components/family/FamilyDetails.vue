<script setup lang="ts">
import { useFamilyStore } from '@/stores/useFamily';
import { storeToRefs } from 'pinia';
import { ref, watch, computed, onMounted } from 'vue';
import { useTypewriter } from '@/composables/useTypewriter';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import FamilyDetailsCard from './FamilyDetailsCard.vue';
import AddPersonToTree from './AddPersonToTree.vue';
import FamilyAuditLog from './FamilyAuditLog.vue';
import { useWatchFamilyStore } from '@/composables/useWatchFamilyStore';

const { isNative } = useDevice();
const familyStore = useFamilyStore();
const { currentFamilyTree, family, shownFamilyDetails, isFamilyTreePrivate } = storeToRefs(familyStore);
const { refreshFamilyTree } = useWatchFamilyStore();

const authStore = useAuthStore();
const { user } = storeToRefs(authStore);

const showAdminSection = ref(false);

const userRole = ref<string | null>(null);

const fetchUserRole = async () => {
    if (!user.value || !family.value) return;
    try {
        const result = await $fetch('/api/roles/get-role', {
            method: 'GET',
            params: { familyId: family.value.id }
        }) as any;
        userRole.value = result.data?.role || null;
    } catch {
        userRole.value = null;
    }
};

onMounted(fetchUserRole);
watch([user, family], fetchUserRole);

const isAdmin = computed(() => {
    if (!userRole.value) return false;
    return ['owner', 'banker', 'admin'].includes(userRole.value);
});

const isMember = computed(() => {
    if (!userRole.value) return false;
    return ['owner', 'banker', 'admin', 'member'].includes(userRole.value);
});

const handlePersonAdded = async () => {
    if (isNative) {
        await Haptics.impact({ style: ImpactStyle.Medium });
    }
    await refreshFamilyTree();
};

const { displayText, isTyping, typeText, reset } = useTypewriter(`The ${family.value?.familyName || ''} Family`, 90, 300);

const familyCodeInput = ref('');

watch(isTyping, (newVal) => {
    if (!newVal) { 
        // When typing is done
        familyStore.setShownFamilyDetails(true);
    } else {
        // When typing starts
    }
});

// Watch for changes in family name to restart the animation
watch(family, (newFamily) => {
    reset();
    typeText();
}, { immediate: true })
</script>

<template>
    <div v-if="family && currentFamilyTree"
        class="relative min-w-full mt-6 overflow-y-auto border rounded-md text-black dark:text-white"
        :class="{'h-fit': isTyping, 'h-full': !isTyping}">
        <h1
            class="sticky top-0 left-0 w-full p-6 font-extralight text-4xl z-40 bg-zinc-100 dark:bg-gradient-to-b dark:from-zinc-900 dark:to-neutral-950 border-b">
            <span v-if="shownFamilyDetails">The {{ family.familyName }} Family</span>
            <span v-else class="relative inline-block min-w-[1px]">
                <span class="relative">
                    {{ displayText }}
                    <span v-if="isTyping" class="absolute top-0 -right-[2px]">|</span>
                </span>
                <span class="invisible">{{ family.familyName }}</span>
            </span>
        </h1>
        <Transition enter-active-class="transition duration-300 ease-out"
            enter-from-class="transform -translate-y-full opacity-0"
            enter-to-class="transform translate-y-0 opacity-100" leave-active-class="transition duration-200 ease-in"
            leave-from-class="transform translate-y-0 opacity-100"
            leave-to-class="transform -translate-y-full opacity-0">
            <div v-if="!isTyping && family.id" class="w-full h-[calc(92vh-4rem)] z-30 p-8 shadow-lg border-b border-zinc-300 dark:border-zinc-600 overflow-y-auto">
                <!-- Family Stats -->
                <FamilyDetailsCard
                    :text="`You have ${ (family.members || []).length } family member${ (family.members || []).length > 1 ? 's' : '' } in your tree.`"
                    type="button"
                />

                <!-- Visibility -->
                <FamilyDetailsCard :text="`Your family tree is ${isFamilyTreePrivate ? 'private & only visible by a link' : 'visible to anyone'}.`">
                    <template #default v-if="isFamilyTreePrivate">
                        <div class="w-fit flex flex-col">
                            <input
                                v-model="familyCodeInput"
                                name="family-code"
                                class="!bg-transparent px-2 py-1 my-3 border rounded-md outline-none text-grass11 h-full w-full selection:bg-grass5 placeholder-mauve8 dark:text-white"
                                placeholder="Create your family tree access code."
                            />
                            <label for="family-code" class="flex flex-col text-sm text-zinc-800 dark:text-white font-light italic">
                                Nobody outside your family will be able to visit your tree without this code.
                                <span>You can change it at anytime.</span>
                            </label>
                        </div>
                    </template>
                </FamilyDetailsCard>

                <!-- Family Details -->
                <FamilyDetailsCard :text="`Created on ${new Date(family.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.`" />
                <FamilyDetailsCard v-if="family.admins" :text="`${family.admins.length} admin${family.admins.length !== 1 ? 's' : ''} managing this tree.`" />

                <!-- Add Person Button -->
                <div v-if="isMember || isAdmin" class="m-3">
                    <AddPersonToTree
                        :family-id="family.id"
                        size="lg"
                        @person-added="handlePersonAdded"
                    />
                </div>

                <!-- Audit Log -->
                <div class="m-3">
                    <FamilyAuditLog :family-id="family.id" />
                </div>

                <!-- Admin Section -->
                <div v-if="isAdmin" class="mt-6">
                    <button
                        @click="showAdminSection = !showAdminSection"
                        class="text-sm text-zinc-600 dark:text-zinc-300 hover:text-zinc-800 dark:hover:text-zinc-100 underline mb-3"
                    >
                        {{ showAdminSection ? 'Hide' : 'Show' }} Admin Panel
                    </button>

                    <div v-if="showAdminSection" class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <FamilyRoleManagement :family-id="family.id" />
                        <FamilyClaimRequestsList :family-id="family.id" />
                        <FamilyInviteLinkGenerator :family-id="family.id" />
                        <FamilyMediaApprovalList :family-id="family.id" />
                        <FamilyAdminManager :family-id="family.id" />
                        <FamilyTempAccessManager :family-id="family.id" />
                        <FamilyDataExport :family-id="family.id" />
                        <FamilyDataImport :family-id="family.id" />
                        <FamilyFamilyMerge :family-id="family.id" />
                        <FamilyDataArchive :family-id="family.id" />
                    </div>
                </div>
            </div>
        </Transition>
    </div>
</template>
