<script setup lang="ts">
import { Icon } from '@iconify/vue';
import {
    MenubarContent,
    MenubarItem,
    MenubarItemIndicator,
    MenubarMenu,
    MenubarPortal,
    MenubarRadioGroup,
    MenubarRadioItem,
    MenubarRoot,
    MenubarSeparator,
    MenubarTrigger,
} from 'radix-vue';

const { isNative } = useDevice();
const authStore = useAuthStore();
const { signOut } = authStore;
const { isAuthenticated, profile, familiesCreatedByMember } = storeToRefs(authStore);
const { family } = storeToRefs(useFamilyStore());

const person = ref('pedro');

const currentMenu = ref('');
let closeTimeout: NodeJS.Timeout | null = null;

const handleMouseEnter = (menuValue: string) => {
    if (isNative) return;
    if (closeTimeout) {
        clearTimeout(closeTimeout);
        closeTimeout = null;
    }
    currentMenu.value = menuValue;
};

const handleMouseLeave = () => {
    if (isNative) return;
    closeTimeout = setTimeout(() => {
        currentMenu.value = '';
    }, 300);
};

const handleContentMouseEnter = () => {
    if (isNative) return;
    if (closeTimeout) {
        clearTimeout(closeTimeout);
        closeTimeout = null;
    }
};

onBeforeUnmount(() => {
    if (closeTimeout) {
        clearTimeout(closeTimeout);
    }
});
</script>

<template>
    <MenubarRoot v-model="currentMenu" class="flex h-fit" @mouseleave="handleMouseLeave">
        <MenubarMenu value="profile">
            <MenubarTrigger @mouseenter="handleMouseEnter('profile')"
                class="text-neutral-900 dark:text-neutral-50 px-2 outline-none select-none font-light leading-none rounded text-[13px] flex items-center justify-between gap-[2px] data-[highlighted]:bg-zinc-200 dark:data-[highlighted]:bg-zinc-700 data-[state=open]:bg-zinc-200 dark:data-[state=open]:bg-zinc-700 cursor-pointer transition-colors">
                <MemberAvatar v-if="isAuthenticated && profile" :person="profile" />
                <div v-else class="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                    <Icon icon="mdi:account" class="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
                </div>
            </MenubarTrigger>
            <MenubarPortal>
                <MenubarContent @mouseenter="handleContentMouseEnter" @mouseleave="handleMouseLeave"
                    class="min-w-[240px] outline-none bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-1.5 shadow-lg z-50"
                    :align="'end'" :side-offset="8" :collision-padding="{ right: 9 }">

                    <!-- Authenticated: profile link, trees, logout -->
                    <template v-if="isAuthenticated && profile">
                        <NuxtLink
                            :to="{ name: 'member-personId', params: { personId: profile.id } }">
                            <MenubarItem
                                class="text-sm text-zinc-900 dark:text-zinc-100 rounded-md flex items-center h-8 px-2 relative select-none outline-none data-[highlighted]:bg-zinc-100 dark:data-[highlighted]:bg-zinc-800 cursor-pointer transition-colors">
                                <Icon icon="mdi:account" class="w-4 h-4 mr-2 text-zinc-500" />
                                View Your Profile
                            </MenubarItem>
                        </NuxtLink>
                        <MenubarSeparator class="h-px bg-zinc-200 dark:bg-zinc-700 my-1" />
                        <MenubarRadioGroup v-model="person">
                            <p class="text-xs text-zinc-400 px-2 py-1">Your Family Trees</p>
                            <MenubarRadioItem
                                v-for="fam in familiesCreatedByMember"
                                :key="fam.id"
                                class="text-sm text-zinc-900 dark:text-zinc-100 rounded-md flex items-center h-8 px-2 pl-6 relative select-none outline-none data-[highlighted]:bg-zinc-100 dark:data-[highlighted]:bg-zinc-800 cursor-pointer transition-colors"
                                :value="`${fam.id}`"
                                :title="`View the ${fam.familyName} tree`"
                            >
                                <NuxtLink
                                    :to="{ name: 'member-personId-tree-familyId', params: { personId: profile.id, familyId: fam.id }}"
                                    class="flex items-center w-full"
                                >
                                    <MenubarItemIndicator
                                        v-if="family && family.id === fam.id"
                                        class="absolute left-1 w-4 inline-flex items-center justify-center">
                                        <Icon icon="radix-icons:dot-filled" />
                                    </MenubarItemIndicator>
                                    The {{ fam.familyName }} Family
                                </NuxtLink>
                            </MenubarRadioItem>
                            <MenubarItem
                                class="text-sm text-zinc-900 dark:text-zinc-100 rounded-md flex items-center h-8 px-2 pl-6 relative select-none outline-none data-[highlighted]:bg-zinc-100 dark:data-[highlighted]:bg-zinc-800 cursor-pointer transition-colors">
                                <FamilyCreateNewTreeButton />
                            </MenubarItem>
                        </MenubarRadioGroup>
                        <MenubarSeparator class="h-px bg-zinc-200 dark:bg-zinc-700 my-1" />
                        <MenubarItem
                            @click="signOut"
                            class="text-sm text-red-600 dark:text-red-400 rounded-md flex items-center h-8 px-2 relative select-none outline-none data-[highlighted]:bg-red-50 dark:data-[highlighted]:bg-red-900/20 cursor-pointer transition-colors">
                            <Icon icon="mdi:logout" class="w-4 h-4 mr-2" />
                            Logout
                        </MenubarItem>
                    </template>

                    <!-- Not authenticated: login/signup -->
                    <template v-else>
                        <NuxtLink to="/signup">
                            <MenubarItem
                                class="text-sm text-zinc-900 dark:text-zinc-100 rounded-md flex items-center h-8 px-2 relative select-none outline-none data-[highlighted]:bg-zinc-100 dark:data-[highlighted]:bg-zinc-800 cursor-pointer transition-colors">
                                <Icon icon="mdi:login" class="w-4 h-4 mr-2 text-zinc-500" />
                                Login / Sign Up
                            </MenubarItem>
                        </NuxtLink>
                    </template>
                </MenubarContent>
            </MenubarPortal>
        </MenubarMenu>
    </MenubarRoot>
</template>
