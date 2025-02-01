<script setup lang="ts">
import type { PersonType } from '@/types/person';

const { person } = defineProps({
    person: {
        type: {} as PropType<PersonType>,
        required: true,
    },
});
</script>

<template>
    <div v-if="person" class="flex flex-col items-center select-none bg-zinc-500 hover:bg-zinc-400 p-2 cursor-auto rounded-md">
        <VisitPersonLink :person="person" />
        <p>{{ person.birth_date ? person.birth_date.split('-')[0] + '-' : '' }}{{ person.death_date ? person.death_date : person.is_living ? 'Living' : 'Deceased (Date Unknown)' }}</p>
    </div>
    <div v-else>
        <p>Unable to Find Persons Info</p>
    </div>
</template>