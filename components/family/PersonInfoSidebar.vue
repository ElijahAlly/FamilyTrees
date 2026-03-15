<script lang="ts" setup>
import { ref, computed, watch, onMounted, reactive } from 'vue';
import { storeToRefs } from 'pinia';
import { Icon } from '@iconify/vue';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { usePersonStore } from '@/stores/usePerson';
import { ShortcutSectionName, useHotkeys } from '../../composables/useHotkeys';
import { useWatchFamilyStore } from '@/composables/useWatchFamilyStore';
import { formatDate } from '@/utils/date';
import { getGenderLabel } from '@/utils/person';
import type { GenderType, FamilyTreeNodeType, PersonType } from '@/types';

const { isNative, isMobile } = useDevice();
const router = useRouter();

const personStore = usePersonStore();
const { clearSelectedPersonInTree, setGoToPersonInTree, setSelectedPersonInTree } = personStore;
const { selectedPersonInTree } = storeToRefs(personStore);

const familyStore = useFamilyStore();
const { currentFamilyTree, family: currentFamily } = storeToRefs(familyStore);
const { refreshFamilyTree } = useWatchFamilyStore();

const authStore = useAuthStore();
const { user } = storeToRefs(authStore);

const showClaimModal = ref(false);

const canClaimPerson = computed(() => {
    if (!user.value || !selectedPersonInTree.value) return false;
    return !selectedPersonInTree.value.claimedBy;
});

const userRole = ref<string | null>(null);

const fetchUserRole = async () => {
    if (!user.value || !currentFamily.value) return;
    try {
        const result = await $fetch('/api/roles/get-role', {
            method: 'GET',
            params: { familyId: currentFamily.value.id }
        }) as any;
        userRole.value = result.data?.role || null;
    } catch {
        userRole.value = null;
    }
};

onMounted(fetchUserRole);
watch([user, currentFamily], fetchUserRole);

const isAdmin = computed(() => {
    if (!userRole.value) return false;
    return ['owner', 'banker', 'admin'].includes(userRole.value);
});

const isMember = computed(() => {
    if (!userRole.value) return false;
    return ['owner', 'banker', 'admin', 'member'].includes(userRole.value);
});

const canEdit = computed(() => isMember.value || isAdmin.value);

const handlePersonAdded = async () => {
    if (isNative) {
        await Haptics.impact({ style: ImpactStyle.Medium });
    }
    await refreshFamilyTree();
};

// --- Inline editing ---
const editForm = reactive({
    firstName: '',
    middleName: '',
    lastName: '',
    birthDate: '',
    deathDate: '',
    gender: 'U' as GenderType,
    isLiving: true,
});

const editing = ref(false);
const saving = ref(false);
const saveError = ref('');

const genderOptions: { value: GenderType; label: string }[] = [
    { value: 'M', label: 'Male' },
    { value: 'F', label: 'Female' },
    { value: 'N', label: 'Non Binary' },
    { value: 'U', label: 'Unspecified' },
];

const todayDate = computed(() => new Date().toISOString().split('T')[0]);

const maxBirthDate = computed(() => {
    if (editForm.deathDate) return editForm.deathDate;
    return todayDate.value;
});

const startEditing = () => {
    if (!selectedPersonInTree.value) return;
    const p = selectedPersonInTree.value;
    editForm.firstName = p.firstName || '';
    editForm.middleName = p.middleName || '';
    editForm.lastName = p.lastName || '';
    editForm.birthDate = p.birthDate || '';
    editForm.deathDate = p.deathDate || '';
    editForm.gender = p.gender || 'U';
    editForm.isLiving = p.isLiving ?? true;
    saveError.value = '';
    editing.value = true;
};

const cancelEditing = () => {
    editing.value = false;
    saveError.value = '';
};

const saveEdits = async () => {
    if (!selectedPersonInTree.value || !currentFamily.value) return;
    if (!editForm.firstName.trim() || !editForm.lastName.trim()) {
        saveError.value = 'First and last name are required.';
        return;
    }
    const today = todayDate.value;
    if (editForm.birthDate && editForm.birthDate > today) {
        saveError.value = 'Birth date cannot be in the future.';
        return;
    }
    if (editForm.deathDate && editForm.deathDate > today) {
        saveError.value = 'Death date cannot be in the future.';
        return;
    }
    if (editForm.birthDate && editForm.deathDate && editForm.birthDate > editForm.deathDate) {
        saveError.value = 'Birth date cannot be after death date.';
        return;
    }
    saving.value = true;
    saveError.value = '';
    try {
        await $fetch('/api/person/update', {
            method: 'POST',
            body: {
                personId: selectedPersonInTree.value.id,
                familyId: currentFamily.value.id,
                firstName: editForm.firstName.trim(),
                middleName: editForm.middleName.trim() || null,
                lastName: editForm.lastName.trim(),
                birthDate: editForm.birthDate || null,
                deathDate: editForm.deathDate || null,
                gender: editForm.gender,
                isLiving: editForm.isLiving,
            },
        });
        // Update the local selected person so the sidebar reflects changes immediately
        setSelectedPersonInTree({
            ...selectedPersonInTree.value,
            firstName: editForm.firstName.trim(),
            middleName: editForm.middleName.trim() || null,
            lastName: editForm.lastName.trim(),
            birthDate: editForm.birthDate || null,
            deathDate: editForm.deathDate || null,
            gender: editForm.gender,
            isLiving: editForm.isLiving,
        });
        editing.value = false;
        await refreshFamilyTree();
    } catch (err: any) {
        saveError.value = err?.data?.message || 'Failed to save changes.';
    } finally {
        saving.value = false;
    }
};

// Reset editing state when person changes
watch(selectedPersonInTree, () => {
    editing.value = false;
    saveError.value = '';
});

// Cross-family navigation: fetch other family trees this person belongs to
const otherFamilies = ref<{ id: number; familyName: string }[]>([]);
const fetchOtherFamilies = async () => {
    otherFamilies.value = [];
    if (!selectedPersonInTree.value) return;
    try {
        const result = await $fetch('/api/get-families-by-person-id', {
            method: 'GET',
            params: { personId: selectedPersonInTree.value.id }
        }) as any;
        const families = result.data || result || [];
        const currentFamId = currentFamily.value?.id;
        otherFamilies.value = families
            .filter((f: any) => f.id !== currentFamId)
            .map((f: any) => ({ id: f.id, familyName: f.familyName }));
    } catch {
        otherFamilies.value = [];
    }
};
watch(selectedPersonInTree, fetchOtherFamilies);

// --- Tree traversal helpers for relationship display ---
const flattenTree = (node: FamilyTreeNodeType | null): PersonType[] => {
    if (!node) return [];
    const result: PersonType[] = [node.member];
    for (const spouse of node.marriages || []) {
        result.push(spouse);
    }
    if (node.spouse) {
        result.push(node.spouse);
    }
    for (const child of node.children || []) {
        result.push(...flattenTree(child));
    }
    return result;
};

const allPeopleInTree = computed(() => {
    if (!currentFamilyTree.value) return new Map<number, PersonType>();
    const map = new Map<number, PersonType>();
    for (const p of flattenTree(currentFamilyTree.value)) {
        if (!map.has(p.id)) map.set(p.id, p);
    }
    return map;
});

const getPersonName = (id: number | null): string | null => {
    if (!id) return null;
    const p = allPeopleInTree.value.get(id);
    if (!p) return null;
    return [p.firstName, p.lastName].filter(Boolean).join(' ');
};

// Fetch parent info from API when not found in the local tree (e.g. different last name)
const fetchedParents = ref<Map<number, PersonType>>(new Map());

const fetchParentIfMissing = async (id: number | null) => {
    if (!id || allPeopleInTree.value.has(id) || fetchedParents.value.has(id)) return;
    try {
        const result = await $fetch('/api/person/profile-view', {
            method: 'GET',
            params: { personId: id }
        }) as any;
        if (result.data) {
            fetchedParents.value.set(id, result.data);
        }
    } catch {
        // Silently fail - will show ID as fallback
    }
};

watch(selectedPersonInTree, async (person) => {
    if (!person) return;
    await Promise.all([
        fetchParentIfMissing(person.motherId),
        fetchParentIfMissing(person.fatherId),
    ]);
}, { immediate: true });

const getPersonNameWithFetch = (id: number | null): string | null => {
    if (!id) return null;
    const fromTree = allPeopleInTree.value.get(id);
    if (fromTree) return [fromTree.firstName, fromTree.lastName].filter(Boolean).join(' ');
    const fetched = fetchedParents.value.get(id);
    if (fetched) return [fetched.firstName, fetched.lastName].filter(Boolean).join(' ');
    return null;
};

const motherName = computed(() => getPersonNameWithFetch(selectedPersonInTree.value?.motherId ?? null));
const fatherName = computed(() => getPersonNameWithFetch(selectedPersonInTree.value?.fatherId ?? null));

// Full siblings: same mother AND father (both must be set)
const siblings = computed(() => {
    if (!selectedPersonInTree.value) return [];
    const selected = selectedPersonInTree.value;
    if (!selected.motherId && !selected.fatherId) return [];
    const result: PersonType[] = [];
    for (const [, p] of allPeopleInTree.value) {
        if (p.id === selected.id) continue;
        if (selected.motherId && selected.fatherId &&
            p.motherId === selected.motherId && p.fatherId === selected.fatherId) {
            result.push(p);
        }
    }
    return result;
});

// Children: people whose motherId or fatherId is the selected person
const children = computed(() => {
    if (!selectedPersonInTree.value) return [];
    const selectedId = selectedPersonInTree.value.id;
    const result: PersonType[] = [];
    for (const [, p] of allPeopleInTree.value) {
        if (p.motherId === selectedId || p.fatherId === selectedId) {
            result.push(p);
        }
    }
    return result;
});

// --- Relationship management ---
const confirmRemoveParent = ref<'motherId' | 'fatherId' | null>(null);
const showRemoveConfirm = ref(false);
const removing = ref(false);
const relationshipError = ref('');

const removePerson = async () => {
    if (!selectedPersonInTree.value || !currentFamily.value) return;
    removing.value = true;
    relationshipError.value = '';
    try {
        await $fetch('/api/person/remove-from-family', {
            method: 'POST',
            body: {
                personId: selectedPersonInTree.value.id,
                familyId: currentFamily.value.id,
            },
        });
        clearSelectedPersonInTree();
        showRemoveConfirm.value = false;
        await refreshFamilyTree();
    } catch (err: any) {
        relationshipError.value = err?.data?.message || err?.data?.error || 'Failed to remove person.';
    } finally {
        removing.value = false;
    }
};

const updatingRelationship = ref(false);

const updateParent = async (field: 'motherId' | 'fatherId', value: number | null, alsoSetSiblings = false) => {
    if (!selectedPersonInTree.value || !currentFamily.value) return;
    updatingRelationship.value = true;
    relationshipError.value = '';
    try {
        const body: Record<string, any> = {
            personId: selectedPersonInTree.value.id,
            familyId: currentFamily.value.id,
        };
        body[field] = value;
        if (alsoSetSiblings) {
            body[field === 'motherId' ? 'setMotherForSiblings' : 'setFatherForSiblings'] = true;
        }
        await $fetch('/api/person/update-relationships', {
            method: 'POST',
            body,
        });
        // Update local state
        setSelectedPersonInTree({
            ...selectedPersonInTree.value,
            [field]: value,
        });
        await refreshFamilyTree();
    } catch (err: any) {
        relationshipError.value = err?.data?.message || err?.data?.error || 'Failed to update relationship.';
    } finally {
        updatingRelationship.value = false;
    }
};

const removeMarriage = async (person1Id: number, person2Id: number) => {
    if (!currentFamily.value) return;
    updatingRelationship.value = true;
    relationshipError.value = '';
    try {
        await $fetch('/api/marriages/delete', {
            method: 'POST',
            body: {
                person1Id,
                person2Id,
                familyId: currentFamily.value.id,
            },
        });
        await refreshFamilyTree();
    } catch (err: any) {
        relationshipError.value = err?.data?.message || err?.data?.error || 'Failed to remove marriage.';
    } finally {
        updatingRelationship.value = false;
    }
};

// Reset relationship UI when person changes
watch(selectedPersonInTree, () => {
    showRemoveConfirm.value = false;
    confirmRemoveParent.value = null;
    relationshipError.value = '';
});

const collapsed = ref(false);
const collapsedStyles = ref('');
const computedClass = computed(() => `${selectedPersonInTree.value ? 'bg-white dark:bg-zinc-900' : 'bg-transparent pointer-events-none'} ${isMobile.value ? 'w-full' : size.value === 'sm' ? 'min-w-[340px]' : 'min-w-[600px]'}`);

const size = ref<'sm' | 'lg'>('sm');
const SIZE_CLASS = 'px-2.5 py-1 cursor-pointer text-zinc-950 dark:text-zinc-50 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-medium';
const SIZE_ACTIVE_CLASS = 'bg-zinc-300 hover:bg-zinc-300 dark:bg-zinc-600 dark:hover:bg-zinc-600';
const smallClass = computed(() => size.value === 'sm' ? `${SIZE_ACTIVE_CLASS} rounded-l-md` : 'rounded-l-md');
const largeClass = computed(() => size.value === 'lg' ? `${SIZE_ACTIVE_CLASS} rounded-r-md` : 'rounded-r-md');

const blurClass = computed(() => `transition-all duration-300 ${collapsed.value ? 'blur-md ml-6' : ''}`);

const toggleSize = (newVal?: 'sm' | 'lg') => {
    if (!newVal) {
        size.value = size.value === 'sm' ? 'lg' : 'sm';
    } else {
        size.value = newVal;
    }
}

const toggleCollapsed = (newVal?: 'show' | 'hide') => {
    if (!newVal) {
        collapsed.value = !collapsed.value;
    } else {
        collapsed.value = newVal === 'show' ? false : true;
    }
}

watch(() => selectedPersonInTree.value, (newVal) => {
    if (newVal && collapsed.value) {
        collapsed.value = false;
    }
});

watch(collapsed, (newValue) => {
    if (newValue) {
        collapsedStyles.value = '';
        setTimeout(() => {
            collapsedStyles.value = 'hover:bg-zinc-300 dark:hover:bg-zinc-900 hover:text-white cursor-pointer';
        }, 300)
    } else {
        collapsedStyles.value = '';
    }
});

watch(currentFamilyTree, (newVal, oldVal) => {
    if (newVal && (!oldVal || newVal.familyId !== oldVal.familyId)) {
        clearSelectedPersonInTree();
    }
})

const { notifyHotkeyAvailable } = useHotkeys(ShortcutSectionName.FAMILY_TREE_PERSON_DETAILS, {
    'p': { action: toggleCollapsed }
});

const personAge = computed(() => {
    if (!selectedPersonInTree.value?.birthDate) return '';
    const birth = new Date(selectedPersonInTree.value.birthDate);
    const end = selectedPersonInTree.value.deathDate
        ? new Date(selectedPersonInTree.value.deathDate)
        : new Date();
    let age = end.getFullYear() - birth.getFullYear();
    const monthDiff = end.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < birth.getDate())) {
        age--;
    }
    return selectedPersonInTree.value.deathDate ? `${age} (at death)` : `${age}`;
});

const fullName = computed(() => {
    if (!selectedPersonInTree.value) return '';
    const p = selectedPersonInTree.value;
    return [p.firstName, p.middleName, p.lastName].filter(Boolean).join(' ');
});

const initials = computed(() => {
    if (!selectedPersonInTree.value) return '';
    const p = selectedPersonInTree.value;
    return `${(p.firstName || '')[0] || ''}${(p.lastName || '')[0] || ''}`.toUpperCase();
});
</script>

<template>
    <div
        v-if="selectedPersonInTree"
        class="h-full flex flex-col absolute top-0 right-0 transition-transform duration-300 ease-in-out z-50 border-l border-zinc-200 dark:border-zinc-700 shadow-xl"
        :class="[
            computedClass,
            collapsedStyles
        ]"
        @click.stop="() => collapsed && toggleCollapsed('show')"
        :style="{
            transform: collapsed ? `translateX(${isMobile ? '100%' : size === 'sm' ? '292px' : '552px'})` : 'translateX(0)',
        }"
    >
        <!-- Header bar -->
        <div class="flex items-center justify-between px-3 py-2 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
            <button
                v-if="collapsed && !isMobile"
                class="p-1 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                @click.stop="() => { toggleCollapsed('show'); notifyHotkeyAvailable(); }"
            >
                <Icon icon="ri:arrow-left-double-fill" class="w-5 h-5 text-zinc-600 dark:text-zinc-300" />
            </button>
            <button
                v-else-if="!isMobile"
                class="p-1 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                @click.stop="() => { toggleCollapsed(); notifyHotkeyAvailable(); }"
            >
                <Icon icon="ri:arrow-right-double-fill" class="w-5 h-5 text-zinc-600 dark:text-zinc-300" />
            </button>

            <span class="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Person Details</span>

            <button
                class="p-1 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 text-zinc-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                @click.stop="clearSelectedPersonInTree"
            >
                <Icon icon="ri:close-line" class="w-5 h-5" />
            </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto">
            <transition name="fade" mode="out-in">
                <div :class="[blurClass]" :key="selectedPersonInTree.id" class="p-4">
                    <!-- Person identity card -->
                    <div class="flex items-center gap-3 mb-4">
                        <div class="w-11 h-11 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-semibold text-sm shrink-0">
                            {{ initials }}
                        </div>
                        <div class="min-w-0 flex-1">
                            <h3 class="text-base font-semibold text-zinc-900 dark:text-zinc-50 truncate">{{ fullName }}</h3>
                            <p v-if="selectedPersonInTree.birthDate" class="text-xs text-zinc-500 dark:text-zinc-400">
                                Age: {{ personAge }} yrs
                            </p>
                        </div>
                        <button
                            v-if="canEdit && !editing"
                            @click.stop="startEditing"
                            class="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors shrink-0"
                            title="Edit details"
                        >
                            <Icon icon="lucide:pencil" class="w-4 h-4" />
                        </button>
                    </div>

                    <!-- EDIT MODE -->
                    <template v-if="editing">
                        <div class="space-y-3 mb-4">
                            <div>
                                <label class="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">First Name *</label>
                                <input
                                    v-model="editForm.firstName"
                                    type="text"
                                    class="w-full px-2.5 py-1.5 text-sm rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Middle Name</label>
                                <input
                                    v-model="editForm.middleName"
                                    type="text"
                                    class="w-full px-2.5 py-1.5 text-sm rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Last Name *</label>
                                <input
                                    v-model="editForm.lastName"
                                    type="text"
                                    class="w-full px-2.5 py-1.5 text-sm rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Gender</label>
                                <select
                                    v-model="editForm.gender"
                                    class="w-full px-2.5 py-1.5 text-sm rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                >
                                    <option v-for="opt in genderOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Birth Date</label>
                                <input
                                    v-model="editForm.birthDate"
                                    type="date"
                                    :max="maxBirthDate"
                                    class="w-full px-2.5 py-1.5 text-sm rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                />
                            </div>
                            <div class="flex items-center gap-2">
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" v-model="editForm.isLiving" class="sr-only peer" />
                                    <div class="w-9 h-5 bg-zinc-300 dark:bg-zinc-600 peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer peer-checked:bg-emerald-500 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                                </label>
                                <span class="text-sm text-zinc-700 dark:text-zinc-200">{{ editForm.isLiving ? 'Living' : 'Deceased' }}</span>
                            </div>
                            <div v-if="!editForm.isLiving">
                                <label class="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Death Date</label>
                                <input
                                    v-model="editForm.deathDate"
                                    type="date"
                                    :min="editForm.birthDate || undefined"
                                    :max="todayDate"
                                    class="w-full px-2.5 py-1.5 text-sm rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                />
                            </div>

                            <!-- Error message -->
                            <p v-if="saveError" class="text-xs text-red-500">{{ saveError }}</p>

                            <!-- Save / Cancel -->
                            <div class="flex gap-2 pt-1">
                                <button
                                    @click.stop="saveEdits"
                                    :disabled="saving"
                                    class="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                                >
                                    {{ saving ? 'Saving...' : 'Save' }}
                                </button>
                                <button
                                    @click.stop="cancelEditing"
                                    :disabled="saving"
                                    class="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </template>

                    <!-- VIEW MODE -->
                    <template v-else>
                        <!-- Quick info pills -->
                        <div class="flex flex-wrap gap-1.5 mb-4">
                            <span v-if="selectedPersonInTree.gender" class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                                {{ getGenderLabel(selectedPersonInTree.gender) }}
                            </span>
                            <span v-if="selectedPersonInTree.isLiving !== undefined" class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" :class="selectedPersonInTree.isLiving ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'">
                                {{ selectedPersonInTree.isLiving ? 'Living' : 'Deceased' }}
                            </span>
                            <span v-if="selectedPersonInTree.claimedBy" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                                <Icon icon="mdi:check-circle" class="w-3 h-3" />
                                Claimed
                            </span>
                        </div>

                        <!-- Detail rows -->
                        <div v-if="selectedPersonInTree.birthDate || selectedPersonInTree.deathDate" class="mb-4 space-y-2">
                            <div v-if="selectedPersonInTree.birthDate" class="flex items-center gap-2 text-sm">
                                <Icon icon="lucide:cake" class="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                <span class="text-zinc-600 dark:text-zinc-300">Birthed on {{ formatDate(selectedPersonInTree.birthDate) }}</span>
                            </div>
                            <div v-if="selectedPersonInTree.deathDate" class="flex items-center gap-2 text-sm">
                                <Icon icon="lucide:heart-off" class="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                <span class="text-zinc-600 dark:text-zinc-300">Passed on {{ formatDate(selectedPersonInTree.deathDate) }}</span>
                            </div>
                        </div>

                        <!-- Actions -->
                        <div class="space-y-2 mb-4">
                            <NuxtLink :to="{ name: 'member-personId', params: { personId: selectedPersonInTree.id }}">
                                <div class="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors">
                                    View Full Profile
                                    <Icon icon="mdi:arrow-right" class="w-4 h-4 text-zinc-400" />
                                </div>
                            </NuxtLink>

                            <button
                                @click.stop="setGoToPersonInTree(selectedPersonInTree)"
                                class="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                            >
                                <Icon icon="mdi:crosshairs-gps" class="w-4 h-4 text-zinc-500" />
                                Find in Tree
                            </button>

                            <!-- Cross-family tree links -->
                            <NuxtLink
                                v-for="fam in otherFamilies"
                                :key="fam.id"
                                :to="{ name: 'member-personId-tree-familyId', params: { personId: selectedPersonInTree.id, familyId: fam.id }}"
                            >
                                <div class="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                                    <span class="flex items-center gap-2">
                                        <Icon icon="lucide:external-link" class="w-4 h-4" />
                                        {{ fam.familyName }} Tree
                                    </span>
                                    <Icon icon="mdi:arrow-right" class="w-4 h-4" />
                                </div>
                            </NuxtLink>
                        </div>

                        <!-- Add Person (relative of selected person) -->
                        <div v-if="(isMember || isAdmin) && currentFamily" class="mb-4">
                            <FamilyAddPersonToTree
                                :family-id="currentFamily.id"
                                :parent-person="selectedPersonInTree"
                                size="sm"
                                @person-added="handlePersonAdded"
                            />
                        </div>

                        <!-- Claim Person button -->
                        <button
                            v-if="canClaimPerson && user"
                            @click.stop="showClaimModal = true"
                            class="w-full px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                        >
                            <Icon icon="mdi:account-check" class="w-4 h-4" />
                            This is me — Claim
                        </button>

                        <!-- Relationships (visible to all) -->
                        <div v-if="selectedPersonInTree.motherId || selectedPersonInTree.fatherId || siblings.length || children.length" class="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                            <p class="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">Relationships</p>

                            <div class="space-y-2 mb-3">
                                <!-- Mother -->
                                <div v-if="selectedPersonInTree.motherId">
                                    <div class="flex items-center justify-between text-sm">
                                        <span class="text-zinc-500 dark:text-zinc-400">Mother</span>
                                        <div class="flex items-center gap-1">
                                            <button
                                                class="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 underline underline-offset-2 decoration-emerald-300 dark:decoration-emerald-700 hover:decoration-emerald-500 transition-colors font-medium"
                                                @click.stop="setSelectedPersonInTree((allPeopleInTree.get(selectedPersonInTree.motherId!) || fetchedParents.get(selectedPersonInTree.motherId!)) as any)"
                                            >
                                                {{ motherName || `ID: ${selectedPersonInTree.motherId}` }}
                                            </button>
                                            <button
                                                v-if="isAdmin && confirmRemoveParent !== 'motherId'"
                                                @click.stop="confirmRemoveParent = 'motherId'"
                                                :disabled="updatingRelationship"
                                                class="p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-zinc-400 hover:text-red-500 transition-colors"
                                                title="Remove mother link"
                                            >
                                                <Icon icon="lucide:x" class="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                    <div v-if="confirmRemoveParent === 'motherId'" class="mt-1 p-2 bg-red-50 dark:bg-red-950/20 rounded-md border border-red-200 dark:border-red-800">
                                        <p class="text-xs text-red-600 dark:text-red-400 mb-2">Remove mother link? This cannot be easily undone.</p>
                                        <div class="flex gap-2">
                                            <button
                                                @click.stop="() => { updateParent('motherId', null); confirmRemoveParent = null; }"
                                                :disabled="updatingRelationship"
                                                class="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                                            >
                                                {{ updatingRelationship ? 'Removing...' : 'Confirm' }}
                                            </button>
                                            <button
                                                @click.stop="confirmRemoveParent = null"
                                                class="px-2 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <!-- Father -->
                                <div v-if="selectedPersonInTree.fatherId">
                                    <div class="flex items-center justify-between text-sm">
                                        <span class="text-zinc-500 dark:text-zinc-400">Father</span>
                                        <div class="flex items-center gap-1">
                                            <button
                                                class="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 underline underline-offset-2 decoration-emerald-300 dark:decoration-emerald-700 hover:decoration-emerald-500 transition-colors font-medium"
                                                @click.stop="setSelectedPersonInTree((allPeopleInTree.get(selectedPersonInTree.fatherId!) || fetchedParents.get(selectedPersonInTree.fatherId!)) as any)"
                                            >
                                                {{ fatherName || `ID: ${selectedPersonInTree.fatherId}` }}
                                            </button>
                                            <button
                                                v-if="isAdmin && confirmRemoveParent !== 'fatherId'"
                                                @click.stop="confirmRemoveParent = 'fatherId'"
                                                :disabled="updatingRelationship"
                                                class="p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-zinc-400 hover:text-red-500 transition-colors"
                                                title="Remove father link"
                                            >
                                                <Icon icon="lucide:x" class="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                    <div v-if="confirmRemoveParent === 'fatherId'" class="mt-1 p-2 bg-red-50 dark:bg-red-950/20 rounded-md border border-red-200 dark:border-red-800">
                                        <p class="text-xs text-red-600 dark:text-red-400 mb-2">Remove father link? This cannot be easily undone.</p>
                                        <div class="flex gap-2">
                                            <button
                                                @click.stop="() => { updateParent('fatherId', null); confirmRemoveParent = null; }"
                                                :disabled="updatingRelationship"
                                                class="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                                            >
                                                {{ updatingRelationship ? 'Removing...' : 'Confirm' }}
                                            </button>
                                            <button
                                                @click.stop="confirmRemoveParent = null"
                                                class="px-2 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <!-- Siblings -->
                                <div v-if="siblings.length" class="flex items-start justify-between text-sm">
                                    <span class="text-zinc-500 dark:text-zinc-400 shrink-0">{{ siblings.length === 1 ? 'Sibling' : 'Siblings' }}</span>
                                    <div class="flex flex-col items-end gap-0.5">
                                        <button
                                            v-for="sib in siblings"
                                            :key="sib.id"
                                            class="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 underline underline-offset-2 decoration-emerald-300 dark:decoration-emerald-700 hover:decoration-emerald-500 transition-colors font-medium"
                                            @click.stop="setSelectedPersonInTree(sib)"
                                        >
                                            {{ sib.firstName }} {{ sib.lastName }}
                                        </button>
                                    </div>
                                </div>

                                <!-- Children -->
                                <div v-if="children.length" class="flex items-start justify-between text-sm">
                                    <span class="text-zinc-500 dark:text-zinc-400 shrink-0">{{ children.length === 1 ? 'Child' : 'Children' }}</span>
                                    <div class="flex flex-col items-end gap-0.5">
                                        <button
                                            v-for="child in children"
                                            :key="child.id"
                                            class="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 underline underline-offset-2 decoration-emerald-300 dark:decoration-emerald-700 hover:decoration-emerald-500 transition-colors font-medium"
                                            @click.stop="setSelectedPersonInTree(child)"
                                        >
                                            {{ child.firstName }} {{ child.lastName }}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <!-- Relationship error -->
                            <p v-if="relationshipError" class="text-xs text-red-500 mb-2">{{ relationshipError }}</p>
                        </div>

                        <!-- Admin: Remove person -->
                        <div v-if="isAdmin && currentFamily" class="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                            <div v-if="!showRemoveConfirm">
                                <button
                                    @click.stop="showRemoveConfirm = true"
                                    class="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                >
                                    <Icon icon="lucide:trash-2" class="w-4 h-4" />
                                    Remove from Tree
                                </button>
                            </div>
                            <div v-else class="space-y-2">
                                <p class="text-xs text-red-600 dark:text-red-400">
                                    This will permanently remove this person, their parent/child links, and any marriage records. Are you sure?
                                </p>
                                <div class="flex gap-2">
                                    <button
                                        @click.stop="removePerson"
                                        :disabled="removing"
                                        class="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                                    >
                                        {{ removing ? 'Removing...' : 'Yes, Remove' }}
                                    </button>
                                    <button
                                        @click.stop="showRemoveConfirm = false"
                                        :disabled="removing"
                                        class="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </template>
                </div>
            </transition>
        </div>

        <!-- Footer (size toggle hidden on mobile since sidebar is full-width) -->
        <div v-if="!isMobile" class="px-4 py-3 border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50" :class="[blurClass]">
            <div class="flex items-center gap-2">
                <span class="text-xs font-medium text-zinc-500 dark:text-zinc-400">Size</span>
                <div class="flex items-center border border-zinc-200 dark:border-zinc-700 rounded-md overflow-hidden">
                    <span :class="[SIZE_CLASS, smallClass]" @click="toggleSize('sm')">S</span>
                    <span :class="[SIZE_CLASS, largeClass]" @click="toggleSize('lg')">L</span>
                </div>
            </div>
        </div>

        <!-- Claim Person Modal -->
        <FamilyClaimPersonModal
            v-if="selectedPersonInTree && currentFamily"
            :person="selectedPersonInTree"
            :family-id="currentFamily.id"
            :show="showClaimModal"
            @close="showClaimModal = false"
            @claimed="showClaimModal = false"
        />
    </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.24s ease-in-out;
}

.fade-enter-from {
  opacity: 0;
  transform: translateX(3px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateX(-3px);
}
</style>