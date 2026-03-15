<script setup lang="ts">
const { isNative } = useDevice();

const { profile } = storeToRefs(useAuthStore());
const { family } = storeToRefs(useFamilyStore());

const showToolbar = computed<boolean>(() => {
    return !!(profile.value && family.value);
})
</script>

<template>
    <!-- show quick links, actions, display relevant info, etc. -->
    <div v-if="showToolbar && profile"
        :class="[
            'flex justify-between fixed left-1/2 -translate-x-1/2 p-2 dark:text-zinc-50 font-extralight rounded-md gap-2 bg-zinc-200 dark:bg-zinc-900 border-[0.5px] border-zinc-800 dark:border-zinc-100 transition-all duration-300',
            isNative ? 'w-[90%] bottom-[calc(1.5rem+env(safe-area-inset-bottom))]' : 'w-1/2 bottom-6'
        ]">
        <MemberLink :person="profile" text="Back to your Profile" class="border border-zinc-600 dark:border-zinc-400 rounded-lg" />
        <NuxtLink v-if="family"
            :to="{ name: 'member-personId-tree-familyId', params: { personId: profile.id, familyId: family.id }}">
            <div
                class="border border-zinc-600 dark:border-zinc-400 rounded-md p-1 hover:bg-zinc-400 dark:hover:bg-zinc-700 transition-colors">
                View the {{ family.familyName }} Tree
            </div>
        </NuxtLink>
        <Button label="Verify"></Button>
    </div>
</template>