<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { PersonType } from '@/types';
import type { PropType } from 'vue';

const props = defineProps({
    person: {
        type: Object as PropType<PersonType>,
        required: true,
    },
    text: {
        type: String,
        required: false
    }
});

const isHovering = ref(false);
</script>

<template>
    <NuxtLink
        :to="{ name: 'member-personId', params: { personId: person.id }}">
        <span @mouseenter="isHovering = true" @mouseleave="isHovering = false"
            class="flex items-center justify-center w-fit bg-zinc-200 hover:text-white hover:bg-zinc-600 dark:text-white dark:hover:text-zinc-950 dark:bg-zinc-600 dark:hover:bg-zinc-300 rounded-md py-1 pl-2 select-none transition-all duration-500"
            :class="{ 'pr-2': !isHovering, 'pr-3': isHovering }">
            <p v-if="!text" class="w-fit mr-2">{{ person.first_name }} {{ person.last_name }}</p>
            <p v-else class="w-fit mr-2">{{ text }}</p>
            <Icon icon="grommet-icons:link-next" class="w-3 h-3 transition-transform duration-300 ease-in-out"
                :class="{ 'translate-x-1': isHovering }" />
        </span>
    </NuxtLink>
</template>