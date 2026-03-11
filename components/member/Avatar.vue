<script setup lang="ts">
import type { PersonType } from '@/types';

const props = defineProps<{
    person: PersonType | null
}>();
</script>

<template>
    <AvatarRoot
        class="bg-blackA3 inline-flex h-[45px] w-[45px] select-none items-center justify-center overflow-hidden rounded-full align-middle">
        <AvatarImage v-if="person?.profile_picture" class="h-full w-full rounded-[inherit] object-cover"
            :src="person.profile_picture" :alt="`${person.first_name} ${person.last_name}`" />
        <AvatarFallback v-else
            class="text-zinc-950 dark:text-zinc-50 leading-1 flex h-full w-full items-center justify-center bg-zinc-400/50 dark:bg-zinc-500/50 text-[15px] font-medium"
            :delay-ms="600">
            {{ person?.first_name[0].toUpperCase() }}{{ person?.last_name[0].toUpperCase() }}
        </AvatarFallback>
    </AvatarRoot>
</template>