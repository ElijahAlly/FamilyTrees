<script setup lang="ts">
import type { PersonType } from '@/types';
import type { PropType } from 'vue';

const { person } = defineProps({
    person: {
        type: {} as PropType<PersonType>,
        required: true,
    },
});
</script>

<template>
    <div v-if="person" class="flex flex-col items-center select-none bg-zinc-500 hover:bg-zinc-400 p-2 cursor-auto rounded-md">
        <MemberLink :person="person" />
        <p>{{ person.birthDate ? person.birthDate.split('-')[0] + '-' : '' }}{{ person.deathDate ? person.deathDate : person.isLiving ? 'Living' : 'Deceased (Date Unknown)' }}</p>
    </div>
    <div v-else>
        <p>Unable to Find Persons Info</p>
    </div>
</template>