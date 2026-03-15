<script setup lang="ts">
import CreateFamilyForm from '@/components/family/CreateFamilyForm.vue';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const { user } = storeToRefs(authStore);

// Redirect if not authenticated
onMounted(() => {
    if (!user.value) {
        navigateTo('/signup?existing=true');
    }
});

const handleFamilyCreated = (family: any) => {
    router.push({
        name: 'member-personId-tree-familyId',
        params: {
            personId: route.params.personId,
            familyId: family.id,
        },
    });
};
</script>

<template>
    <div class="min-h-screen w-full flex items-start justify-center pt-24 p-4">
        <CreateFamilyForm @created="handleFamilyCreated" />
    </div>
</template>
