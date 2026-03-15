<script setup lang="ts">
import type { PersonType, FetchTypeList, FamilyType, FetchTypeSingle } from '@/types';

const props = defineProps<{
    person: PersonType | null
}>();

const { familiesCreatedByMember } = storeToRefs(useAuthStore());
const isLoading = ref(false);
const treeCreatedBy = ref<{[key: number]: string}>({});
const visibilityTitle: { public: string, private: string } = {
    public: 'The tree is visible to everyone, including members that are not in your family.',
    private: 'This tree is only visible to you and other members with a link + access code.'
};

const setTreesCreators = async () => {
    familiesCreatedByMember.value.forEach(async (fam) => {
        if (fam.createdBy === props.person?.id) {
            treeCreatedBy.value[fam.id] = getFullName(props.person);
        } else {
            const { data: personData, error: personError }: FetchTypeSingle<PersonType> = await $fetch('/api/get-person-by-id', {
                method: 'GET',
                params: {
                    select: '*',
                    id: fam.createdBy,
                }
            })
                
            if (personError) {
                console.error(personError);
                treeCreatedBy.value[fam.id] = '(Unkown, creator not found)';
            } else {
                treeCreatedBy.value[fam.id] = getFullName(personData);
            }
        }
    })
}

onMounted(async () => {
    watch(() => props.person, async () => {
        if (!props.person) return;
        isLoading.value = true;
        const { data: familyData, error: familyError }: FetchTypeList<FamilyType> = await $fetch('/api/get-families-by-created-by-person-id', {
            method: 'GET',
            params: {
                personId: props.person.id,
            }
        });

        if (familyError) {
            console.error(familyError);
            isLoading.value = false;
            return;
        }

        familiesCreatedByMember.value = familyData;
        await setTreesCreators();
        isLoading.value = false;
    })
});
</script>

<template>
    <div v-if="person && !isLoading"
        class="relative w-3/4 h-64 border rounded-md shadow-md dark:text-zinc-50">
        <UiCardTitle :title="`Family Trees (${familiesCreatedByMember.length})`" />
        <div class="flex h-full max-w-full overflow-x-auto p-6 gap-x-4">
            <div v-for="family in familiesCreatedByMember" :key="family.id" class="relative min-w-[500px] border rounded p-2">
                <NuxtLink
                    :to="{ name: 'member-personId-tree-familyId', params: { personId: person.id, familyId: family.id }}"
                    class="max-w-fit">
                    <span
                        class="max-w-fit hover:text-zinc-900 hover:bg-zinc-200 rounded p-1 transition-all font-semibold underline underline-offset-2"
                        :title="`Click to view the ${family.familyName} tree`">
                        The {{ family.familyName }} family
                    </span>
                </NuxtLink>
                <ul class="pl-6 list-disc">
                    <li>Created by {{ treeCreatedBy[family.id] }}</li>
                    <li>Has {{ (family.members || []).length }} member{{(family.members || []).length > 1 ? 's' : ''}}</li>
                    <li>Created on {{ formatDate(family.createdAt) }}</li>

                    <!-- <li>Has {{ family.collaborators.length }} collaborator{{family.collaborators.length > 1 ? 's' : ''}}</li> -->
                </ul>
                <div class="absolute top-3 right-3 border rounded-full py-[0.5px] px-2 bg-red-200 dark:bg-red-400/60 text-zinc-950 dark:text-white capitalize"
                    :title="visibilityTitle[family.visibility]">
                    {{ family.visibility }}
                </div>
            </div>
        </div>
    </div>
    <div v-else class="w-3/4 h-64 p-6 border rounded-md shadow-md bg-zinc-200 dark:bg-zinc-700 animate-pulse">
    </div>
</template>