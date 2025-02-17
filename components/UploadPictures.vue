<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { type PersonType } from '@/types/person';
import { type FamilyType } from '@/types/family';
import type { FetchTypeList, PostType } from '@/types/fetch';
import type { PropType } from 'vue';

const { person } = defineProps({
    person: {
        type: {} as PropType<PersonType | null>,
        required: true,
    }
});

const emit = defineEmits(['picturesUploaded']);

const handleFileUpload = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (!files || !person) return;

    if (files.length > 3) {
        alert('Please select a maximum of 3 files');
        input.value = '';
        return;
    }

    const { data: familyData, error: familyError }: FetchTypeList<FamilyType> = await $fetch('/api/get-family-by-name-and-person-id', {
        method: 'GET',
        params: {
            familyName: person.last_name,
            id: person.id
        }
    });
    if (familyError) throw familyError;

    const familyId = familyData[0].id;

    try {
        const formData = new FormData();
        
        // Add each file to the FormData
        for (let i = 0; i < files.length; i++) {
            formData.append(`files[]`, files[i]);
        }

        const pics = (person.pictures || [])
            .filter(pic => pic)
            .map(pic => pic.replaceAll(',', '__comma__'));
            
        // Add other necessary data
        formData.append('pictures', pics.toString());
        formData.append('familyId', familyId.toString());
        formData.append('id', person.id.toString());

        const { success, data: picturesData, error: picturesError }: PostType = await $fetch('/api/add-pictures-to-person', {
            method: 'POST',
            body: formData
        });

        if (!success) throw picturesError;

        // Clear the input after successful upload
        input.value = '';

        emit('picturesUploaded', picturesData);

    } catch (error) {
        console.error('Upload error:', error);
        // Show error message to user
    }
};
</script>

<template>
    <div 
        v-if="person"
        @click="$refs.fileInput.click()"
        class="flex items-center justify-center w-48 h-48 mx-9 border rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all duration-300 cursor-pointer"
    >
        <Icon icon="material-symbols:add-photo-alternate-outline" class="inline-block w-6 h-6" />
        <input
            ref="fileInput"
            type="file"
            accept="image/*"
            @change="handleFileUpload"
            multiple
            class="h-0 w-0"
        />
    </div>
</template>