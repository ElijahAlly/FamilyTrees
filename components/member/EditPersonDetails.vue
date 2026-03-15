<script setup lang="ts">
import { ref, watch } from 'vue';
import { Icon } from '@iconify/vue';
import type { PersonType } from '@/types';

const props = defineProps<{
    person: PersonType;
    familyId?: number;
}>();

const emit = defineEmits<{
    (e: 'updated', person: any): void;
    (e: 'close'): void;
}>();

const submitting = ref(false);
const error = ref('');

const firstName = ref(props.person.firstName);
const middleName = ref(props.person.middleName || '');
const lastName = ref(props.person.lastName);
const birthDate = ref(props.person.birthDate || '');
const deathDate = ref(props.person.deathDate || '');
const gender = ref(props.person.gender || 'U');
const isLiving = ref(props.person.isLiving);

const email = ref((props.person.extendedInfo as any)?.email || '');
const phone = ref((props.person.extendedInfo as any)?.phone || '');
const occupation = ref((props.person.extendedInfo as any)?.occupation || '');
const address = ref((props.person.extendedInfo as any)?.address || '');

const handleSubmit = async () => {
    if (!firstName.value.trim() || !lastName.value.trim()) {
        error.value = 'First name and last name are required.';
        return;
    }

    submitting.value = true;
    error.value = '';

    try {
        const result = await $fetch('/api/person/update', {
            method: 'POST',
            body: {
                personId: props.person.id,
                familyId: props.familyId,
                firstName: firstName.value.trim(),
                middleName: middleName.value.trim() || null,
                lastName: lastName.value.trim(),
                birthDate: birthDate.value || null,
                deathDate: isLiving.value ? null : deathDate.value || null,
                gender: gender.value,
                isLiving: isLiving.value,
                extendedInfo: {
                    email: email.value.trim() || undefined,
                    phone: phone.value.trim() || undefined,
                    occupation: occupation.value.trim() || undefined,
                    address: address.value.trim() || undefined,
                },
            },
        }) as any;

        if (result.success) {
            emit('updated', result.data);
        } else {
            error.value = result.error || 'Failed to update.';
        }
    } catch (err: any) {
        error.value = err.message || 'An error occurred.';
    } finally {
        submitting.value = false;
    }
};
</script>

<template>
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="emit('close')">
        <div class="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-lg w-full mx-4 p-6 max-h-[85vh] overflow-y-auto">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold dark:text-white">Edit Person Details</h3>
                <button @click="emit('close')" class="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                    <Icon icon="mdi:close" class="w-5 h-5" />
                </button>
            </div>

            <form @submit.prevent="handleSubmit" class="space-y-3">
                <!-- Name Fields -->
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-sm font-medium dark:text-zinc-300 mb-1">First Name *</label>
                        <input
                            v-model="firstName"
                            type="text"
                            required
                            class="w-full px-3 py-2 border dark:border-zinc-600 rounded-md bg-transparent dark:text-white text-sm outline-none focus:border-emerald-500"
                        />
                    </div>
                    <div>
                        <label class="block text-sm font-medium dark:text-zinc-300 mb-1">Last Name *</label>
                        <input
                            v-model="lastName"
                            type="text"
                            required
                            class="w-full px-3 py-2 border dark:border-zinc-600 rounded-md bg-transparent dark:text-white text-sm outline-none focus:border-emerald-500"
                        />
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium dark:text-zinc-300 mb-1">Middle Name</label>
                    <input
                        v-model="middleName"
                        type="text"
                        class="w-full px-3 py-2 border dark:border-zinc-600 rounded-md bg-transparent dark:text-white text-sm outline-none focus:border-emerald-500"
                        placeholder="Optional"
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
                        />
                    </div>
                </div>

                <hr class="dark:border-zinc-700" />
                <h4 class="text-sm font-semibold dark:text-zinc-200">Additional Details</h4>

                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-sm font-medium dark:text-zinc-300 mb-1">Email</label>
                        <input
                            v-model="email"
                            type="email"
                            class="w-full px-3 py-2 border dark:border-zinc-600 rounded-md bg-transparent dark:text-white text-sm outline-none focus:border-emerald-500"
                            placeholder="Optional"
                        />
                    </div>
                    <div>
                        <label class="block text-sm font-medium dark:text-zinc-300 mb-1">Phone</label>
                        <input
                            v-model="phone"
                            type="tel"
                            class="w-full px-3 py-2 border dark:border-zinc-600 rounded-md bg-transparent dark:text-white text-sm outline-none focus:border-emerald-500"
                            placeholder="Optional"
                        />
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium dark:text-zinc-300 mb-1">Occupation</label>
                    <input
                        v-model="occupation"
                        type="text"
                        class="w-full px-3 py-2 border dark:border-zinc-600 rounded-md bg-transparent dark:text-white text-sm outline-none focus:border-emerald-500"
                        placeholder="Optional"
                    />
                </div>

                <div>
                    <label class="block text-sm font-medium dark:text-zinc-300 mb-1">Address</label>
                    <input
                        v-model="address"
                        type="text"
                        class="w-full px-3 py-2 border dark:border-zinc-600 rounded-md bg-transparent dark:text-white text-sm outline-none focus:border-emerald-500"
                        placeholder="Optional"
                    />
                </div>

                <!-- Error -->
                <p v-if="error" class="text-sm text-red-500">{{ error }}</p>

                <!-- Actions -->
                <div class="flex gap-2 pt-2">
                    <button
                        type="button"
                        @click="emit('close')"
                        class="flex-1 px-4 py-2 border dark:border-zinc-600 rounded-md text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        :disabled="submitting"
                        class="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 transition-colors text-sm"
                    >
                        {{ submitting ? 'Saving...' : 'Save Changes' }}
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>
