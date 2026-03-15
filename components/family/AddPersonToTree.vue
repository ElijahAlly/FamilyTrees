<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Icon } from '@iconify/vue';
import type { PersonType } from '@/types';
import { usePersonStore, type QuickAddRelationship } from '@/stores/usePerson';

const props = defineProps<{
    familyId: number;
    size?: 'sm' | 'lg';
    parentPerson?: PersonType | null;
    initialRelationship?: QuickAddRelationship;
    hideButton?: boolean;
}>();

const emit = defineEmits<{
    (e: 'personAdded', person: any): void;
}>();

const authStore = useAuthStore();
const { user } = storeToRefs(authStore);

const personStore = usePersonStore();
const { quickAddRelationship } = storeToRefs(personStore);

const showModal = ref(false);
const submitting = ref(false);
const error = ref('');

const firstName = ref('');
const lastName = ref('');
const middleName = ref('');
const birthDate = ref('');
const deathDate = ref('');
const gender = ref<'M' | 'F' | 'N' | 'U'>('U');
const isLiving = ref(true);
const reason = ref('');
const relationship = ref<'child' | 'spouse' | 'parent' | 'sibling' | 'none'>('none');

const isSmall = computed(() => props.size === 'sm');

const buttonClass = computed(() =>
    isSmall.value
        ? 'px-2 py-1.5 text-xs rounded-md'
        : 'px-4 py-2 text-sm rounded-md'
);

const resetForm = () => {
    firstName.value = '';
    lastName.value = '';
    middleName.value = '';
    birthDate.value = '';
    deathDate.value = '';
    gender.value = 'U';
    isLiving.value = true;
    reason.value = '';
    relationship.value = 'none';
    error.value = '';
};

const openModal = (presetRelationship?: QuickAddRelationship) => {
    resetForm();
    if (props.parentPerson) {
        lastName.value = props.parentPerson.lastName;
        relationship.value = presetRelationship || props.initialRelationship || 'child';
    }
    showModal.value = true;
};

const closeModal = () => {
    showModal.value = false;
    resetForm();
    personStore.clearQuickAdd();
};

// Watch for quick-add trigger from tree
watch(quickAddRelationship, (newVal) => {
    if (newVal && props.parentPerson) {
        openModal(newVal);
    }
});

const handleSubmit = async () => {
    if (!firstName.value.trim() || !lastName.value.trim()) {
        error.value = 'First name and last name are required.';
        return;
    }

    if (!user.value) {
        error.value = 'You must be logged in.';
        return;
    }

    submitting.value = true;
    error.value = '';

    try {
        let motherId = null;
        let fatherId = null;

        if (props.parentPerson && relationship.value === 'child') {
            if (props.parentPerson.gender === 'F') {
                motherId = props.parentPerson.id;
            } else {
                fatherId = props.parentPerson.id;
            }
        } else if (props.parentPerson && relationship.value === 'sibling') {
            // Copy parent IDs from the relative person
            motherId = props.parentPerson.motherId || null;
            fatherId = props.parentPerson.fatherId || null;
        }

        const result = await $fetch('/api/person/add-to-family', {
            method: 'POST',
            body: {
                firstName: firstName.value.trim(),
                lastName: lastName.value.trim(),
                middleName: middleName.value.trim() || null,
                birthDate: birthDate.value || null,
                deathDate: isLiving.value ? null : deathDate.value || null,
                gender: gender.value,
                isLiving: isLiving.value,
                motherId,
                fatherId,
                familyId: props.familyId,
                userId: user.value.id,
                reason: reason.value.trim() || null,
                relationship: relationship.value,
                relativePersonId: props.parentPerson?.id || null,
            },
        }) as any;

        if (result.success) {
            emit('personAdded', result.data);
            closeModal();
        } else {
            error.value = result.error || 'Failed to add person.';
        }
    } catch (err: any) {
        error.value = err.message || 'An error occurred.';
    } finally {
        submitting.value = false;
    }
};

const relationshipLabel = computed(() => {
    if (!props.parentPerson) return '';
    const name = props.parentPerson.firstName;
    switch (relationship.value) {
        case 'child': return `Will be added as a child of ${name}`;
        case 'spouse': return `Will be added as spouse of ${name}`;
        case 'parent': return `Will be added as a parent of ${name}`;
        case 'sibling': return `Will be added as a sibling of ${name}`;
        default: return `No relationship to ${name}`;
    }
});
</script>

<template>
    <div>
        <button
            v-if="user && !hideButton"
            @click.stop="openModal()"
            :class="[
                'flex items-center gap-1 bg-emerald-600 text-white hover:bg-emerald-700 transition-colors font-medium',
                buttonClass,
            ]"
        >
            <Icon icon="mdi:account-plus" :class="isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'" />
            {{ isSmall ? 'Add Person' : 'Add Person to Tree' }}
        </button>

        <!-- Modal -->
        <Teleport to="body">
            <div
                v-if="showModal"
                class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                @click.self="closeModal"
            >
                <div
                    :class="[
                        'bg-white dark:bg-zinc-900 rounded-lg shadow-xl mx-4 p-6 overflow-y-auto',
                        isSmall ? 'max-w-sm w-full max-h-[80vh]' : 'max-w-lg w-full max-h-[85vh]',
                    ]"
                >
                    <div class="flex items-center justify-between mb-4">
                        <h3 :class="['font-semibold dark:text-white', isSmall ? 'text-base' : 'text-lg']">
                            Add Person to Family Tree
                        </h3>
                        <button @click="closeModal" class="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                            <Icon icon="mdi:close" class="w-5 h-5" />
                        </button>
                    </div>

                    <div v-if="parentPerson" class="mb-4 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm dark:text-zinc-300">
                        <p class="font-medium mb-1">Adding relative of <strong>{{ parentPerson.firstName }} {{ parentPerson.lastName }}</strong></p>
                        <p class="text-xs text-zinc-500 dark:text-zinc-400">{{ relationshipLabel }}</p>
                    </div>

                    <form @submit.prevent="handleSubmit" class="space-y-3">
                        <!-- Relationship (only if parent person is provided) -->
                        <div v-if="parentPerson">
                            <label class="block text-sm font-medium dark:text-zinc-300 mb-1">Relationship</label>
                            <select
                                v-model="relationship"
                                class="w-full px-3 py-2 border dark:border-zinc-600 rounded-md bg-transparent dark:text-white text-sm outline-none"
                            >
                                <option value="child">Child of {{ parentPerson.firstName }}</option>
                                <option value="spouse">Spouse of {{ parentPerson.firstName }}</option>
                                <option value="parent">Parent of {{ parentPerson.firstName }}</option>
                                <option value="sibling">Sibling of {{ parentPerson.firstName }}</option>
                                <option value="none">No direct relation</option>
                            </select>
                        </div>

                        <!-- Name Fields -->
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-sm font-medium dark:text-zinc-300 mb-1">First Name *</label>
                                <input
                                    v-model="firstName"
                                    type="text"
                                    required
                                    class="w-full px-3 py-2 border dark:border-zinc-600 rounded-md bg-transparent dark:text-white text-sm outline-none focus:border-emerald-500"
                                    placeholder="First name"
                                />
                            </div>
                            <div>
                                <label class="block text-sm font-medium dark:text-zinc-300 mb-1">Last Name *</label>
                                <input
                                    v-model="lastName"
                                    type="text"
                                    required
                                    class="w-full px-3 py-2 border dark:border-zinc-600 rounded-md bg-transparent dark:text-white text-sm outline-none focus:border-emerald-500"
                                    placeholder="Last name"
                                />
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium dark:text-zinc-300 mb-1">Middle Name</label>
                            <input
                                v-model="middleName"
                                type="text"
                                class="w-full px-3 py-2 border dark:border-zinc-600 rounded-md bg-transparent dark:text-white text-sm outline-none focus:border-emerald-500"
                                placeholder="Middle name (optional)"
                            />
                        </div>

                        <!-- Gender -->
                        <div>
                            <label class="block text-sm font-medium dark:text-zinc-300 mb-1">Gender</label>
                            <select
                                v-model="gender"
                                class="w-full px-3 py-2 border dark:border-zinc-600 rounded-md bg-transparent dark:text-white text-sm outline-none"
                            >
                                <option value="M">Male</option>
                                <option value="F">Female</option>
                                <option value="N">Non-binary</option>
                                <option value="U">Unknown</option>
                            </select>
                        </div>

                        <!-- Dates -->
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-sm font-medium dark:text-zinc-300 mb-1">Birth Date</label>
                                <input
                                    v-model="birthDate"
                                    type="date"
                                    class="w-full px-3 py-2 border dark:border-zinc-600 rounded-md bg-transparent dark:text-white text-sm outline-none focus:border-emerald-500"
                                />
                            </div>
                            <div>
                                <label class="flex items-center gap-2 text-sm font-medium dark:text-zinc-300 mb-1">
                                    <input type="checkbox" v-model="isLiving" class="rounded" />
                                    Living
                                </label>
                                <input
                                    v-if="!isLiving"
                                    v-model="deathDate"
                                    type="date"
                                    class="w-full px-3 py-2 border dark:border-zinc-600 rounded-md bg-transparent dark:text-white text-sm outline-none focus:border-emerald-500"
                                    placeholder="Death date"
                                />
                            </div>
                        </div>

                        <!-- Reason -->
                        <div>
                            <label class="block text-sm font-medium dark:text-zinc-300 mb-1">Reason (optional)</label>
                            <textarea
                                v-model="reason"
                                rows="2"
                                class="w-full px-3 py-2 border dark:border-zinc-600 rounded-md bg-transparent dark:text-white text-sm outline-none focus:border-emerald-500 resize-none"
                                placeholder="Why are you adding this person?"
                            />
                        </div>

                        <!-- Error -->
                        <p v-if="error" class="text-sm text-red-500">{{ error }}</p>

                        <!-- Actions -->
                        <div class="flex gap-2 pt-2">
                            <button
                                type="button"
                                @click="closeModal"
                                class="flex-1 px-4 py-2 border dark:border-zinc-600 rounded-md text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                :disabled="submitting"
                                class="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 transition-colors text-sm"
                            >
                                {{ submitting ? 'Adding...' : 'Add Person' }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Teleport>
    </div>
</template>
