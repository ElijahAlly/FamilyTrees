<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { getFullName } from '@/utils/person';
import { getPersonPictureUrl, getLegacyPersonPictureUrl } from '@/utils/pictures';
import type { FetchTypeList, FamilyType, PersonType } from '@/types';
import UploadPictures from '../UploadPictures.vue';
import { usePermissions } from '@/composables/usePermissions';

const props = defineProps<{
    person: PersonType | null
}>();

const authStore = useAuthStore();
const { user, profile } = storeToRefs(authStore);
const { userRole, isAdmin, fetchRole, canUploadPhotos } = usePermissions();

const familyId = ref<number | null>(null);

const currentImageIndex = ref(0);
const isLoading = ref(false);

const canUpload = computed(() => {
    if (!user.value || !props.person || !profile.value) return false;
    return canUploadPhotos(profile.value, props.person, user.value.id);
});

const getPictureUrl = (index: number) => {
    if (!props.person || !familyId.value) return '';
    const pic = props.person.pictures[index];
    // Numeric strings are gpapics media IDs, otherwise legacy local filenames
    if (/^\d+$/.test(pic)) {
        return getPersonPictureUrl(pic);
    }
    return getLegacyPersonPictureUrl(familyId.value, props.person.id, pic);
};

const nextImage = () => {
    if (!props.person) return;
    // Allow going up to pictures.length (which shows the upload form)
    if (currentImageIndex.value < props.person.pictures.length && canUpload.value) {
        currentImageIndex.value++;
    } else if (currentImageIndex.value < props.person.pictures.length - 1) {
        currentImageIndex.value++;
    }
}

const previousImage = () => {
    if (currentImageIndex.value > 0) {
        currentImageIndex.value--;
    }
}

const showUpload = computed(() => {
    if (!props.person) return false;
    return currentImageIndex.value === props.person.pictures.length;
})

watch(() => props.person?.pictures.length, () => {
    currentImageIndex.value = 0;
});

watch(() => props.person, async (newPerson) => {
    if (!newPerson) return;
    isLoading.value = true;
    try {
        const { data: familyData, error: familyError }: FetchTypeList<FamilyType> = await $fetch('/api/get-family-by-name-and-person-id', {
            method: 'GET',
            params: {
                familyName: newPerson.lastName,
                id: newPerson.id
            }
        });

        if (familyError || !familyData?.length) {
            if (familyError) console.error(familyError);
            return;
        }

        familyId.value = familyData[0].id;

        // Fetch user's role for permission checks
        if (user.value && familyId.value) {
            fetchRole(user.value.id, familyId.value);
        }
    } finally {
        isLoading.value = false;
    }
}, { immediate: true });

const handleUploadedPictures = (pictures: string[]) => {
    if (props.person) {
        props.person.pictures = pictures;
    }
}
</script>

<template>
    <div v-if="person && !isLoading" class="relative w-1/4 h-64 p-6 border rounded-md shadow-md dark:text-zinc-50">
        <UiCardTitle :title="`Photos (${person.pictures.length})`" />
        <div class="flex justify-center relative select-none">
            <button v-if="person.pictures.length" :disabled="currentImageIndex == 0" @click="previousImage"
                class="absolute left-0 top-1/2 -translate-y-1/2 h-12 text-white dark:text-black bg-zinc-900 dark:bg-zinc-200 px-2 rounded-full disabled:bg-black/20 dark:disabled:bg-zinc-200/30 disabled:cursor-not-allowed"
                aria-label="Previous image">
                <span class="sr-only">Previous</span>
                ←
            </button>
            <NuxtImg v-if="familyId && person.pictures.length > 0 && !showUpload"
                :src="getPictureUrl(currentImageIndex)"
                :alt="`Picture of ${getFullName(person)}`" class="w-52 h-52 object-cover rounded-md mx-9" />
            <UploadPictures v-if="showUpload && canUpload" :person="person" @picturesUploaded="handleUploadedPictures" />
            <div v-else-if="showUpload && !canUpload" class="flex flex-col items-center justify-center w-52 h-52 mx-9 text-zinc-400 dark:text-zinc-500 text-sm text-center">
                <span>No photos yet</span>
            </div>
            <button v-if="person.pictures.length" :disabled="showUpload" @click="nextImage"
                class="absolute right-0 top-1/2 -translate-y-1/2 h-12 text-white dark:text-black bg-zinc-900 dark:bg-zinc-200 px-2 rounded-full disabled:bg-black/20 dark:disabled:bg-zinc-200/30 disabled:cursor-not-allowed"
                aria-label="Next image">
                <span class="sr-only">Next</span>
                →
            </button>
        </div>
    </div>
    <div v-else class="w-1/4 h-64 p-6 border rounded-md shadow-md bg-zinc-200 dark:bg-zinc-700 animate-pulse"></div>
</template>