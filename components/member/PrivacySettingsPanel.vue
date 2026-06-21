<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { Icon } from '@iconify/vue';
import type { PrivacyControls, ViewType } from '@/types';

const props = defineProps<{
    personId: number;
    currentSettings: PrivacyControls;
}>();

const emit = defineEmits<{
    updated: [settings: PrivacyControls];
}>();

const authStore = useAuthStore();
const { user } = storeToRefs(authStore);

const settings = ref<PrivacyControls>({ ...props.currentSettings });
const saving = ref(false);
const saved = ref(false);

// Time-based rule form
const showTimeRuleForm = ref(false);
const newRuleGroup = ref<'family' | 'friends' | 'public'>('family');
const newRuleShowAfter = ref('');
const newRuleHideAfter = ref('');

watch(() => props.currentSettings, (newVal) => {
    settings.value = { ...newVal };
}, { deep: true });

const handleSave = async () => {
    if (!user.value) return;

    saving.value = true;
    saved.value = false;

    try {
        const result = await $fetch('/api/person/update-privacy', {
            method: 'POST',
            body: {
                personId: props.personId,
                userId: user.value.id,
                privacySettings: settings.value,
            },
        }) as any;

        if (result.success) {
            saved.value = true;
            emit('updated', settings.value);
            setTimeout(() => saved.value = false, 2000);
        }
    } catch (err) {
        console.error('Failed to update privacy settings:', err);
    } finally {
        saving.value = false;
    }
};

const addTimeRule = () => {
    settings.value.timeBasedRules.push({
        group: newRuleGroup.value,
        showAfter: newRuleShowAfter.value ? new Date(newRuleShowAfter.value) : null,
        hideAfter: newRuleHideAfter.value ? new Date(newRuleHideAfter.value) : null,
    });
    showTimeRuleForm.value = false;
    newRuleShowAfter.value = '';
    newRuleHideAfter.value = '';
};

const removeTimeRule = (index: number) => {
    settings.value.timeBasedRules.splice(index, 1);
};
</script>

<template>
    <div class="w-full p-4 border dark:border-zinc-700 rounded-lg">
        <h3 class="text-lg font-semibold dark:text-white mb-4 flex items-center gap-2">
            <Icon icon="mdi:shield-lock" class="w-5 h-5" />
            Privacy Settings
        </h3>

        <!-- View toggles -->
        <div class="space-y-3 mb-6">
            <div class="flex items-center justify-between">
                <div>
                    <p class="dark:text-white font-medium">Family View</p>
                    <p class="text-xs text-zinc-500 dark:text-zinc-400">Visible to members of your family</p>
                </div>
                <button
                    @click="settings.familyView = !settings.familyView"
                    :class="[
                        'relative w-11 h-6 rounded-full transition-colors',
                        settings.familyView ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'
                    ]"
                >
                    <span :class="[
                        'absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow',
                        settings.familyView ? 'translate-x-5.5' : 'translate-x-0.5'
                    ]" />
                </button>
            </div>

            <div v-if="settings.familyView" class="ml-4 flex items-center gap-2">
                <input
                    type="checkbox"
                    v-model="settings.requireSameLastName"
                    class="rounded"
                />
                <label class="text-sm text-zinc-600 dark:text-zinc-300">
                    Require same last name to view details
                </label>
            </div>

            <div class="flex items-center justify-between">
                <div>
                    <p class="dark:text-white font-medium">Friends View</p>
                    <p class="text-xs text-zinc-500 dark:text-zinc-400">Visible to your friends</p>
                </div>
                <button
                    @click="settings.friendsView = !settings.friendsView"
                    :class="[
                        'relative w-11 h-6 rounded-full transition-colors',
                        settings.friendsView ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'
                    ]"
                >
                    <span :class="[
                        'absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow',
                        settings.friendsView ? 'translate-x-5.5' : 'translate-x-0.5'
                    ]" />
                </button>
            </div>

            <div class="flex items-center justify-between">
                <div>
                    <p class="dark:text-white font-medium">Public View</p>
                    <p class="text-xs text-zinc-500 dark:text-zinc-400">Visible to everyone</p>
                </div>
                <button
                    @click="settings.publicView = !settings.publicView"
                    :class="[
                        'relative w-11 h-6 rounded-full transition-colors',
                        settings.publicView ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'
                    ]"
                >
                    <span :class="[
                        'absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow',
                        settings.publicView ? 'translate-x-5.5' : 'translate-x-0.5'
                    ]" />
                </button>
            </div>
        </div>

        <!-- Time-based rules -->
        <div class="mb-6">
            <div class="flex items-center justify-between mb-2">
                <p class="dark:text-white font-medium text-sm">Time-Based Rules</p>
                <button
                    @click="showTimeRuleForm = !showTimeRuleForm"
                    class="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                    {{ showTimeRuleForm ? 'Cancel' : '+ Add Rule' }}
                </button>
            </div>

            <!-- Existing rules -->
            <div v-for="(rule, index) in settings.timeBasedRules" :key="index" class="flex items-center justify-between text-sm bg-zinc-50 dark:bg-zinc-800 rounded p-2 mb-1">
                <div class="dark:text-zinc-300">
                    <span class="font-medium capitalize">{{ rule.group }}</span>
                    <span v-if="rule.showAfter"> — show after {{ new Date(rule.showAfter).toLocaleDateString() }}</span>
                    <span v-if="rule.hideAfter"> — hide after {{ new Date(rule.hideAfter).toLocaleDateString() }}</span>
                </div>
                <button @click="removeTimeRule(index)" class="text-red-500 hover:text-red-700">
                    <Icon icon="mdi:close" class="w-4 h-4" />
                </button>
            </div>

            <!-- New rule form -->
            <div v-if="showTimeRuleForm" class="border dark:border-zinc-600 rounded p-3 mt-2 space-y-2">
                <select v-model="newRuleGroup" class="w-full border dark:border-zinc-600 rounded p-1.5 text-sm dark:bg-zinc-800 dark:text-white">
                    <option value="family">Family</option>
                    <option value="friends">Friends</option>
                    <option value="public">Public</option>
                </select>
                <div class="flex gap-2">
                    <div class="flex-1">
                        <label class="text-xs text-zinc-500 dark:text-zinc-400">Show after</label>
                        <input type="date" v-model="newRuleShowAfter" class="w-full border dark:border-zinc-600 rounded p-1.5 text-sm dark:bg-zinc-800 dark:text-white" />
                    </div>
                    <div class="flex-1">
                        <label class="text-xs text-zinc-500 dark:text-zinc-400">Hide after</label>
                        <input type="date" v-model="newRuleHideAfter" class="w-full border dark:border-zinc-600 rounded p-1.5 text-sm dark:bg-zinc-800 dark:text-white" />
                    </div>
                </div>
                <button @click="addTimeRule" class="w-full text-sm bg-blue-600 text-white rounded py-1.5 hover:bg-blue-700 transition-colors">
                    Add Rule
                </button>
            </div>
        </div>

        <!-- Age restrictions -->
        <div class="mb-6">
            <div class="flex items-center gap-2 mb-2">
                <input
                    type="checkbox"
                    :checked="!!settings.ageRestrictions"
                    @change="settings.ageRestrictions = settings.ageRestrictions ? null : { minAge: 13, restrictedFields: ['birthDate', 'extendedInfo'] }"
                    class="rounded"
                />
                <label class="dark:text-white font-medium text-sm">Enable age restrictions</label>
            </div>
            <div v-if="settings.ageRestrictions" class="ml-6">
                <label class="text-xs text-zinc-500 dark:text-zinc-400">Minimum age to view restricted fields</label>
                <input
                    type="number"
                    v-model.number="settings.ageRestrictions.minAge"
                    class="w-20 border dark:border-zinc-600 rounded p-1.5 text-sm dark:bg-zinc-800 dark:text-white ml-2"
                    min="0"
                    max="100"
                />
            </div>
        </div>

        <!-- Save button -->
        <button
            @click="handleSave"
            :disabled="saving"
            :class="[
                'w-full py-2 rounded-md text-white transition-colors',
                saved ? 'bg-emerald-600' : 'bg-blue-600 hover:bg-blue-700',
                saving ? 'opacity-50' : ''
            ]"
        >
            {{ saved ? 'Saved!' : saving ? 'Saving...' : 'Save Privacy Settings' }}
        </button>
    </div>
</template>
