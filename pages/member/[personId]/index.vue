<script setup lang="ts">
import type { PersonType, FetchTypeSingle } from '@/types';
import { getFullName, getGenderLabel } from '@/utils/person';
import { useBannerStore } from '@/stores/useBannerStore';
import { formatDate } from '@/utils/date';
import { ref, onUnmounted } from 'vue';
import { useRoute } from 'nuxt/app';
import MemberPhotos from '@/components/member/MemberPhotos.vue';

const route = useRoute();
const bannerStore = useBannerStore();
const { profile } = storeToRefs(useAuthStore());
const person = ref<PersonType | null>(null);
const isLoading = ref(false);
const { skeletonClasses } = useSkeleton(isLoading);

const fetchPerson = async () => {
    const personId = Number(route.params.personId);
    if (!personId) return;
    isLoading.value = true;

    try {
        const response: FetchTypeSingle<PersonType> = await $fetch('/api/get-person-by-id', {
            method: 'GET',
            params: {
                select: '*',
                id: personId,
            },
        });

        if (response.data) {
            person.value = response.data;
        } else {
            person.value = null;
        }
    } catch (error) {
        console.error('Error fetching person:', error);
        person.value = null;
    } finally {
        isLoading.value = false;
    }
};

const setBanner = () => {
    bannerStore.setBannerInfo(
        'Person Details',
        `Viewing details for ${getFullName(person.value)}`
    );
}

// Watch for route param changes
watch(() => route.params.personId, () => {
    if (profile.value && profile.value.id === Number(route.params.personId)) {
        person.value = profile.value;
    } else {
        fetchPerson();
    }
    setBanner();
});

// Initial fetch
onMounted(() => {
    if (!profile.value || (profile.value && profile.value.id !== Number(route.params.personId))) {
        fetchPerson();
    } else {
        person.value = profile.value;
    }
    setBanner();
});

onUnmounted(() => {
    bannerStore.clearBannerInfo();
});
</script>

<template>
    <div class="min-h-screen w-full p-4 text-zinc-950 dark:text-zinc-50">
        <!-- Actual Content -->
        <div class="min-h-screen w-full p-4 text-zinc-950 dark:text-zinc-50">
            <div class="w-full flex justify-center my-3 p-2 gap-2">
                <MemberAvatar :person="person" :class="[skeletonClasses]" />
                <h1 :class="['font-extralight text-4xl min-w-40 min-h-12', skeletonClasses]">{{ getFullName(person) }}</h1>
            </div>

            <div class="flex w-full items-end grid-cols-2 gap-4 mb-4">
                <MemberPhotos :person="person" />
                <MemberFamiliesCreatedByMember :person="person" />
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div class="p-4 rounded-md border">
                    <h2 class="font-semibold mb-2">Personal Information</h2>
                    <p><span class="font-medium">Gender:</span> {{ getGenderLabel(person?.gender) }}</p>
                    <p>
                        <span class="font-medium">Birth Date:</span> {{ formatDate(person?.birth_date) }}
                    </p>
                    <p v-if="!person?.is_living">
                        <span class="font-medium">Death Date:</span> {{ formatDate(person?.death_date) }}
                    </p>
                </div>

                <div class="p-4 rounded-md border" v-if="person?.mother_id || person?.father_id">
                    <!-- <h2 class="font-semibold mb-2">Parents</h2>
          <p v-if="person.mother_id">
            <span class="font-medium">Mother ID:</span> {{ person.mother_id }}
          </p>
          <p v-if="person.father_id">
            <span class="font-medium">Father ID:</span> {{ person.father_id }}
          </p> -->
                </div>
            </div>
        </div>

        <div v-if="!person && !isLoading" class="text-center py-8">
            <p class="text-gray-600">Person not found</p>
        </div>
    </div>
</template>