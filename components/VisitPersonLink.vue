<script setup lang="ts">
import type { AutoStyleClass } from '@/types/auto-styles';
const autoStyleClass: AutoStyleClass = 'visit-person-link-as';
import { Icon } from '@iconify/vue'
import type { PersonType } from '@/types/person';

const { person } = defineProps({
    person: {
        type: {} as PropType<PersonType>,
        required: true,
    },
});
</script>

<template>
    <NuxtLink :to="{ name: 'familyName-member-personId', params: { familyName:  person.last_name, personId: person.id }}" :class="autoStyleClass">
        <span class="flex items-center justify-center w-fit bg-zinc-200 hover:text-white hover:bg-zinc-600 dark:text-white dark:bg-zinc-600 dark:hover:bg-zinc-800 rounded-md py-1 px-2 select-none">
            <p class="w-fit mr-2">{{ person.first_name }} {{ person.last_name }}</p>
            <Icon icon="grommet-icons:link-next" class="w-3 h-3"/> 
        </span>
    </NuxtLink>
</template>