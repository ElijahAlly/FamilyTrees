<script setup lang="ts">
import type { PersonType } from '@/types/person';
import type { FetchTypeList } from '@/types/fetch';
import { getFullName, getGenderLabel } from '@/utils/person';
import { useBannerStore } from '@/stores/useBannerStore';
import { formatDate } from '@/utils/person';
import { useRoute } from 'nuxt/app';
import { ref, watchEffect, onUnmounted } from 'vue';

const route = useRoute();
const personId = Number(route.params.personId);
const bannerStore = useBannerStore();

const response: FetchTypeList<PersonType> = await $fetch('/api/get-person-by-id', {
  method: 'GET',
  params: {
    select: '*',
    id: personId,
  },
});

const person = ref<PersonType | null>(null);

watchEffect(() => {
  if (!personId || response.error) {
    person.value = null;
    return;
  }
  if (response.data && response.data.length > 0) {
    bannerStore.setBannerInfo(
      'Person Details',
      `Viewing details for ${getFullName(response.data[0])}`
    );
    person.value = response.data[0];
    return;
  }
  person.value = null;
});

onUnmounted(() => {
  bannerStore.clearBannerInfo();
});
</script>

<template>
  <div v-if="person" class="min-h-screen w-full p-4">
    <div class="flex items-end grid-cols-2 gap-4 mb-4">
      <UserCard :person="person" />
    </div>

    <div class="grid grid-cols-2 gap-4 dark:text-white">
      <div class="p-4 rounded-md border">
        <h2 class="font-semibold mb-2">Personal Information</h2>
        <p><span class="font-medium">Gender:</span> {{ getGenderLabel(person.gender) }}</p>
        <p v-if="person.birth_date">
          <span class="font-medium">Birth Date:</span> {{ formatDate(person.birth_date) }}
        </p>
        <p v-if="person.death_date && !person.is_living">
          <span class="font-medium">Death Date:</span> {{ formatDate(person.death_date) }}
        </p>
      </div>

      <div class="p-4 rounded-md border" v-if="person.mother_id || person.father_id">
        <h2 class="font-semibold mb-2">Parents</h2>
        <p v-if="person.mother_id">
          <span class="font-medium">Mother ID:</span> {{ person.mother_id }}
        </p>
        <p v-if="person.father_id">
          <span class="font-medium">Father ID:</span> {{ person.father_id }}
        </p>
      </div>
    </div>
  </div>
  <div v-else class="text-center py-8">
    <p class="text-gray-600">Person not found</p>
  </div>
</template>