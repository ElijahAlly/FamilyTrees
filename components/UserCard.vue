<script setup lang="ts">
import { type PropType } from 'vue';
import { type PersonType } from '@/types/person';
import { getFullName } from '@/utils/person';
import { type FamilyType } from '@/types/family';
import { getPersonPictureUrl } from '@/utils/supabase';
import type { FetchTypeList } from '@/types/fetch';

const { person } = defineProps({
    person: {
        type: {} as PropType<PersonType | null>,
        required: true,
    }
});

const familyId = ref<number | null>(null);

const currentImageIndex = ref(0)

const nextImage = () => {
    if (!person) return;
    if (currentImageIndex.value < person.pictures.length) {
        currentImageIndex.value++;
    }
}

const previousImage = () => {
    if (currentImageIndex.value > 0) {
        currentImageIndex.value--;
    }
}

const showUpload = computed(() => {
    if (!person) return false;
    return currentImageIndex.value === person.pictures.length;
})

watch(() => person?.pictures.length, () => {
    currentImageIndex.value = 0;
});


onMounted(async () => {
    if (!person) return;

    const { data: familyData, error: familyError }: FetchTypeList<FamilyType> = await $fetch('/api/get-family-by-name-and-person-id', {
        method: 'GET',
        params: {
            familyName: person.last_name,
            id: person.id
        }
    });

    if (familyError) {
        console.error(familyError);
        return;
    }

    familyId.value = familyData[0].id;
});

const handleUploadedPictures = (pictures: string[]) => {
    if (person) {
        person.pictures = pictures;
    }
}
</script>

<template>
    <div v-if="person" class="w-fit h-fit p-6 border rounded-md shadow-md dark:text-white">
        <h1 class="text-2xl mb-6 font-extralight">{{ getFullName(person) }}</h1>
        <div class="flex justify-center relative select-none">
            <button 
                v-if="person.pictures.length"
                :disabled="currentImageIndex == 0"
                @click="previousImage"
                class="absolute left-0 top-1/2 -translate-y-1/2 h-12 bg-black/50 text-white dark:bg-zinc-800 px-1 rounded-full disabled:bg-black/20 dark:disabled:bg-zinc-800/30"
                aria-label="Previous image"
            >
                <span class="sr-only">Previous</span>
                ←
            </button>
            <img
                v-if="familyId && person.pictures.length > 0 && !showUpload"
                :src="getPersonPictureUrl(familyId, person.id, person.pictures[currentImageIndex])"
                :alt="`Picture of ${getFullName(person)}`"
                class="w-48 h-48 object-cover rounded mx-9"
            />
            <UploadPictures 
                v-if="showUpload"
                :person="person" 
                @picturesUploaded="handleUploadedPictures" 
            />
            <button
                v-if="person.pictures.length"
                :disabled="showUpload" 
                @click="nextImage"
                class="absolute right-0 top-1/2 -translate-y-1/2 h-12 bg-black/50 text-white dark:bg-zinc-800 px-1 rounded-full disabled:bg-black/20 dark:disabled:bg-zinc-800/30"
                aria-label="Next image"
            >
                <span class="sr-only">Next</span>
                →
            </button>
        </div>
    </div>
    <div v-else>
        <h1 class="text-2xl font-bold mb-6">No person selected</h1>
    </div>
</template>