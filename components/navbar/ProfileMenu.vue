<script setup lang="ts">
import { Icon } from '@iconify/vue';
import {
    MenubarCheckboxItem,
    MenubarContent,
    MenubarItem,
    MenubarItemIndicator,
    MenubarMenu,
    MenubarPortal,
    MenubarRadioGroup,
    MenubarRadioItem,
    MenubarRoot,
    MenubarSeparator,
    MenubarSub,
    MenubarSubContent,
    MenubarSubTrigger,
    MenubarTrigger,
    MenubarArrow,
    AvatarFallback, 
    AvatarImage, 
    AvatarRoot
} from 'radix-vue';

const { profile, familiesCreatedByMember } = storeToRefs(useAuthStore());
const { family } = storeToRefs(useFamilyStore());

const checkboxOne = ref(false);
const checkboxTwo = ref(false);
const person = ref('pedro');

const handleClick = () => {
    // eslint-disable-next-line no-alert
    // alert('hello!')
}

const currentMenu = ref('');
let closeTimeout: NodeJS.Timeout | null = null;

const handleMouseEnter = (menuValue: string) => {
    if (closeTimeout) {
        clearTimeout(closeTimeout);
        closeTimeout = null;
    }
    currentMenu.value = menuValue;
};

const handleMouseLeave = () => {
    closeTimeout = setTimeout(() => {
        currentMenu.value = '';
    }, 300); // 300ms delay before closing
};

const handleContentMouseEnter = () => {
    if (closeTimeout) {
        clearTimeout(closeTimeout);
        closeTimeout = null;
    }
};

// Clean up timeout if component is unmounted
onBeforeUnmount(() => {
    if (closeTimeout) {
        clearTimeout(closeTimeout);
    }
});
</script>

<template>
    <MenubarRoot v-model="currentMenu" class="flex mx-6 h-fit" @mouseleave="handleMouseLeave">
        <MenubarMenu value="file">
            <MenubarTrigger @mouseenter="handleMouseEnter('file')"
                class="text-neutral-900 dark:text-neutral-50 px-3 outline-none select-none font-light text-md flex items-center justify-between gap-[2px] data-[highlighted]:bg-green4 data-[state=open]:bg-green4">
                File
            </MenubarTrigger>
            <MenubarPortal>
                <MenubarContent @mouseenter="handleContentMouseEnter" @mouseleave="handleMouseLeave"
                    class="min-w-[220px] outline-none bg-neutral-50 dark:bg-neutral-950 border-[0.5px] border-zinc-600 dark:border-zinc-50 rounded-md p-[5px] shadow-md [animation-duration:_400ms] [animation-timing-function:_cubic-bezier(0.16,_1,_0.3,_1)] will-change-[transform,opacity] z-50"
                    :align="'start'" :side-offset="5" :align-offset="-3">
                    <MenubarArrow class="fill-zinc-600 dark:fill-neutral-50" />
                    <MenubarItem
                        class="group text-[13px] leading-none text-neutral-900 dark:text-neutral-50 rounded flex items-center h-[25px] px-[10px] relative select-none outline-none data-[state=open]:bg-green4 data-[highlighted]:bg-gradient-to-br data-[highlighted]:from-green9 data-[highlighted]:to-green10 data-[highlighted]:text-green1 data-[highlighted]:data-[state=open]:text-green1 data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none">
                        New Tab
                        <div
                            class="ml-auto pl-5 text-neutral-900 dark:text-neutral-50 group-data-[highlighted]:bg-red-200/50 group-data-[disabled]:text-mauve8">
                            ⌘ T
                        </div>
                    </MenubarItem>
                    <MenubarItem
                        class="group text-[13px] leading-none text-neutral-900 dark:text-neutral-50 rounded flex items-center h-[25px] px-[10px] relative select-none outline-none data-[state=open]:bg-green4 data-[highlighted]:bg-gradient-to-br data-[highlighted]:from-green9 data-[highlighted]:to-green10 data-[highlighted]:text-green1 data-[highlighted]:data-[state=open]:text-green1 data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none">
                        New Window
                        <div
                            class="ml-auto pl-5 text-neutral-900 dark:text-neutral-50 group-data-[highlighted]:bg-red-200/50 group-data-[disabled]:text-mauve8">
                            ⌘ N
                        </div>
                    </MenubarItem>
                    <MenubarItem
                        class="text-[13px] leading-none text-neutral-900 dark:text-neutral-50 rounded flex items-center h-[25px] px-[10px] relative select-none outline-none data-[state=open]:bg-green4 data-[highlighted]:bg-gradient-to-br data-[highlighted]:from-green9 data-[highlighted]:to-green10 data-[highlighted]:text-green1 data-[highlighted]:data-[state=open]:text-green1 data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none"
                        disabled>
                        New Incognito Window
                    </MenubarItem>
                    <MenubarSeparator class="h-[0.5px] bg-zinc-950 dark:bg-zinc-50 m-[5px]" />
                    <MenubarSub>
                        <MenubarSubTrigger @mouseenter="handleContentMouseEnter"
                            class="group text-[13px] leading-none text-neutral-900 dark:text-neutral-50 rounded flex items-center h-[25px] px-[10px] relative select-none outline-none data-[state=open]:bg-green4 data-[highlighted]:bg-gradient-to-br data-[highlighted]:from-green9 data-[highlighted]:to-green10 data-[highlighted]:text-green1 data-[highlighted]:data-[state=open]:text-green1 data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none">
                            Share
                            <div
                                class="ml-auto pl-5 text-neutral-900 dark:text-neutral-50 group-data-[highlighted]:bg-red-200/50 group-data-[disabled]:text-mauve8">
                                <Icon icon="radix-icons:chevron-right" />
                            </div>
                        </MenubarSubTrigger>
                        <MenubarPortal>
                            <MenubarSubContent @mouseenter="handleContentMouseEnter" @mouseleave="handleMouseLeave"
                                class="min-w-[220px] outline-none bg-neutral-50 dark:bg-neutral-950 border-[0.5px] border-zinc-600 dark:border-zinc-50 rounded-md p-[5px] shadow-md [animation-duration:_400ms] [animation-timing-function:_cubic-bezier(0.16,_1,_0.3,_1)] will-change-[transform,opacity]"
                                :align-offset="-5">
                                <MenubarItem
                                    class="text-[13px] leading-none text-neutral-900 dark:text-neutral-50 rounded flex items-center h-[25px] px-[10px] relative select-none outline-none data-[state=open]:bg-green4 data-[highlighted]:bg-gradient-to-br data-[highlighted]:from-green9 data-[highlighted]:to-green10 data-[highlighted]:text-green1 data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none">
                                    Email Link
                                </MenubarItem>
                                <MenubarItem
                                    class="text-[13px] leading-none text-neutral-900 dark:text-neutral-50 rounded flex items-center h-[25px] px-[10px] relative select-none outline-none data-[state=open]:bg-green4 data-[highlighted]:bg-gradient-to-br data-[highlighted]:from-green9 data-[highlighted]:to-green10 data-[highlighted]:text-green1 data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none">
                                    Messages
                                </MenubarItem>
                                <MenubarItem
                                    class="text-[13px] leading-none text-neutral-900 dark:text-neutral-50 rounded flex items-center h-[25px] px-[10px] relative select-none outline-none data-[state=open]:bg-green4 data-[highlighted]:bg-gradient-to-br data-[highlighted]:from-green9 data-[highlighted]:to-green10 data-[highlighted]:text-green1 data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none">
                                    Notes
                                </MenubarItem>
                            </MenubarSubContent>
                        </MenubarPortal>
                    </MenubarSub>
                    <MenubarSeparator class="h-[0.5px] bg-zinc-950 dark:bg-zinc-50 m-[5px]" />
                    <MenubarItem
                        class="group text-[13px] leading-none text-neutral-900 dark:text-neutral-50 rounded flex items-center h-[25px] px-[10px] relative select-none outline-none data-[highlighted]:bg-gradient-to-br data-[highlighted]:from-green9 data-[highlighted]:to-green10 data-[highlighted]:text-green1 data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none">
                        Print…
                        <div
                            class="ml-auto pl-5 text-neutral-900 dark:text-neutral-50 group-data-[highlighted]:bg-red-200/50 group-data-[disabled]:text-mauve8">
                            ⌘ P
                        </div>
                    </MenubarItem>
                </MenubarContent>
            </MenubarPortal>
        </MenubarMenu>

        <MenubarMenu value="edit">
            <MenubarTrigger @mouseenter="handleMouseEnter('edit')"
                class="text-neutral-900 dark:text-neutral-50 px-3 outline-none select-none font-light text-md flex items-center justify-between gap-[2px] data-[highlighted]:bg-green4 data-[state=open]:bg-green4">
                Edit
            </MenubarTrigger>
            <MenubarPortal>
                <MenubarContent @mouseenter="handleContentMouseEnter" @mouseleave="handleMouseLeave"
                    class="min-w-[220px] outline-none bg-neutral-50 dark:bg-neutral-950 border-[0.5px] border-zinc-600 dark:border-zinc-50 rounded-md p-[5px] shadow-md [animation-duration:_400ms] [animation-timing-function:_cubic-bezier(0.16,_1,_0.3,_1)] will-change-[transform,opacity] z-50"
                    :align="'start'" :side-offset="5" :align-offset="-3">
                    <MenubarArrow class="fill-zinc-600 dark:fill-neutral-50" />
                    <MenubarItem
                        class="group text-[13px] leading-none text-neutral-900 dark:text-neutral-50 rounded flex items-center h-[25px] px-[10px] relative select-none outline-none data-[state=open]:bg-green4 data-[highlighted]:bg-gradient-to-br data-[highlighted]:from-green9 data-[highlighted]:to-green10 data-[highlighted]:text-green1 data-[highlighted]:data-[state=open]:text-green1 data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none">
                        Undo
                        <div
                            class="ml-auto pl-5 text-neutral-900 dark:text-neutral-50 group-data-[highlighted]:bg-red-200/50 group-data-[disabled]:text-mauve8">
                            ⌘ Z
                        </div>
                    </MenubarItem>
                    <MenubarItem
                        class="group text-[13px] leading-none text-neutral-900 dark:text-neutral-50 rounded flex items-center h-[25px] px-[10px] relative select-none outline-none data-[state=open]:bg-green4 data-[highlighted]:bg-gradient-to-br data-[highlighted]:from-green9 data-[highlighted]:to-green10 data-[highlighted]:text-green1 data-[highlighted]:data-[state=open]:text-green1 data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none">
                        Redo
                        <div
                            class="ml-auto pl-5 text-neutral-900 dark:text-neutral-50 group-data-[highlighted]:bg-red-200/50 group-data-[disabled]:text-mauve8">
                            ⇧ ⌘ Z
                        </div>
                    </MenubarItem>
                    <MenubarSeparator class="h-[0.5px] bg-zinc-950 dark:bg-zinc-50 m-[5px]" />
                    <MenubarSub>
                        <MenubarSubTrigger @mouseenter="handleContentMouseEnter"
                            class="group text-[13px] leading-none text-neutral-900 dark:text-neutral-50 rounded flex items-center h-[25px] px-[10px] relative select-none outline-none data-[state=open]:bg-green4 data-[highlighted]:bg-gradient-to-br data-[highlighted]:from-green9 data-[highlighted]:to-green10 data-[highlighted]:text-green1 data-[highlighted]:data-[state=open]:text-green1 data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none">
                            Find
                            <div
                                class="ml-auto pl-5 text-neutral-900 dark:text-neutral-50 group-data-[highlighted]:bg-red-200/50 group-data-[disabled]:text-mauve8">
                                <Icon icon="radix-icons:chevron-right" />
                            </div>
                        </MenubarSubTrigger>

                        <MenubarPortal>
                            <MenubarSubContent @mouseenter="handleContentMouseEnter" @mouseleave="handleMouseLeave"
                                class="min-w-[220px] outline-none bg-neutral-50 dark:bg-neutral-950 border-[0.5px] border-zinc-600 dark:border-zinc-50 rounded-md p-[5px] shadow-md [animation-duration:_400ms] [animation-timing-function:_cubic-bezier(0.16,_1,_0.3,_1)] will-change-[transform,opacity]"
                                :align-offset="-5">
                                <MenubarItem
                                    class="group text-[13px] leading-none text-neutral-900 dark:text-neutral-50 rounded flex items-center h-[25px] px-[10px] relative select-none outline-none data-[state=open]:bg-green4 data-[highlighted]:bg-gradient-to-br data-[highlighted]:from-green9 data-[highlighted]:to-green10 data-[highlighted]:text-green1 data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none">
                                    Search the web…
                                </MenubarItem>
                                <MenubarSeparator class="h-[0.5px] bg-zinc-950 dark:bg-zinc-50 m-[5px]" />
                                <MenubarItem
                                    class="text-[13px] leading-none text-neutral-900 dark:text-neutral-50 rounded flex items-center h-[25px] px-[10px] relative select-none outline-none data-[state=open]:bg-green4 data-[highlighted]:bg-gradient-to-br data-[highlighted]:from-green9 data-[highlighted]:to-green10 data-[highlighted]:text-green1 data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none">
                                    Find…
                                </MenubarItem>
                                <MenubarItem
                                    class="text-[13px] leading-none text-neutral-900 dark:text-neutral-50 rounded flex items-center h-[25px] px-[10px] relative select-none outline-none data-[state=open]:bg-green4 data-[highlighted]:bg-gradient-to-br data-[highlighted]:from-green9 data-[highlighted]:to-green10 data-[highlighted]:text-green1 data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none">
                                    Find Next
                                </MenubarItem>
                                <MenubarItem
                                    class="text-[13px] leading-none text-neutral-900 dark:text-neutral-50 rounded flex items-center h-[25px] px-[10px] relative select-none outline-none data-[state=open]:bg-green4 data-[highlighted]:bg-gradient-to-br data-[highlighted]:from-green9 data-[highlighted]:to-green10 data-[highlighted]:text-green1 data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none">
                                    Find Previous
                                </MenubarItem>
                            </MenubarSubContent>
                        </MenubarPortal>
                    </MenubarSub>
                    <MenubarSeparator class="h-[0.5px] bg-zinc-950 dark:bg-zinc-50 m-[5px]" />
                    <MenubarItem
                        class="text-[13px] leading-none text-neutral-900 dark:text-neutral-50 rounded flex items-center h-[25px] px-[10px] relative select-none outline-none data-[state=open]:bg-green4 data-[highlighted]:bg-gradient-to-br data-[highlighted]:from-green9 data-[highlighted]:to-green10 data-[highlighted]:text-green1 data-[highlighted]:data-[state=open]:text-green1 data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none">
                        Cut
                    </MenubarItem>
                    <MenubarItem
                        class="text-[13px] leading-none text-neutral-900 dark:text-neutral-50 rounded flex items-center h-[25px] px-[10px] relative select-none outline-none data-[state=open]:bg-green4 data-[highlighted]:bg-gradient-to-br data-[highlighted]:from-green9 data-[highlighted]:to-green10 data-[highlighted]:text-green1 data-[highlighted]:data-[state=open]:text-green1 data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none">
                        Copy
                    </MenubarItem>
                    <MenubarItem
                        class="text-[13px] leading-none text-neutral-900 dark:text-neutral-50 rounded flex items-center h-[25px] px-[10px] relative select-none outline-none data-[state=open]:bg-green4 data-[highlighted]:bg-gradient-to-br data-[highlighted]:from-green9 data-[highlighted]:to-green10 data-[highlighted]:text-green1 data-[highlighted]:data-[state=open]:text-green1 data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none">
                        Paste
                    </MenubarItem>
                </MenubarContent>
            </MenubarPortal>
        </MenubarMenu>

        <MenubarMenu value="view">
            <MenubarTrigger @mouseenter="handleMouseEnter('view')"
                class="text-neutral-900 dark:text-neutral-50 px-3 outline-none select-none font-light text-md flex items-center justify-between gap-[2px] data-[highlighted]:bg-green4 data-[state=open]:bg-green4">
                View
            </MenubarTrigger>
            <MenubarPortal>
                <MenubarContent @mouseenter="handleContentMouseEnter" @mouseleave="handleMouseLeave"
                    class="min-w-[220px] outline-none bg-neutral-50 dark:bg-neutral-950 border-[0.5px] border-zinc-600 dark:border-zinc-50 rounded-md p-[5px] shadow-md [animation-duration:_400ms] [animation-timing-function:_cubic-bezier(0.16,_1,_0.3,_1)] will-change-[transform,opacity] z-50"
                    :align="'start'" :side-offset="5" :align-offset="-14">
                    <MenubarArrow class="fill-zinc-600 dark:fill-neutral-50" />
                    <MenubarCheckboxItem v-model="checkboxOne"
                        class="group text-[13px] leading-none text-neutral-900 dark:text-neutral-50 rounded-[3px] flex items-center h-[25px] px-[5px] relative pl-[20px] select-none outline-none data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:bg-green9 data-[highlighted]:text-green1">
                        <MenubarItemIndicator class="absolute left-0 w-[20px] inline-flex items-center justify-center">
                            <Icon icon="radix-icons:check" />
                        </MenubarItemIndicator>
                        Show Bookmarks
                        <div
                            class="ml-auto pl-[20px] text-mauve11 group-data-[highlighted]:bg-red-200/50 group-data-[disabled]:text-mauve8">
                            ⌘+B
                        </div>
                    </MenubarCheckboxItem>
                    <MenubarCheckboxItem v-model="checkboxTwo"
                        class="text-[13px] leading-none text-neutral-900 dark:text-neutral-50 rounded-[3px] flex items-center h-[25px] px-[5px] relative pl-[20px] select-none outline-none data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:bg-green9 data-[highlighted]:text-green1">
                        <MenubarItemIndicator class="absolute left-0 w-[20px] inline-flex items-center justify-center">
                            <Icon icon="radix-icons:check" />
                        </MenubarItemIndicator>
                        Show Full URLs
                    </MenubarCheckboxItem>
                    <MenubarSeparator class="h-[0.5px] bg-zinc-950 dark:bg-zinc-50 m-[5px]" />
                    <MenubarItem
                        class="group text-[13px] leading-none text-neutral-900 dark:text-neutral-50 rounded flex items-center h-[25px] px-[10px] relative select-none pl-5 outline-none data-[state=open]:bg-green4 data-[highlighted]:bg-gradient-to-br data-[highlighted]:from-green9 data-[highlighted]:to-green10 data-[highlighted]:text-green1 data-[highlighted]:data-[state=open]:text-green1 data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none">
                        Reload
                        <div
                            class="ml-auto pl-5 text-neutral-900 dark:text-neutral-50 group-data-[highlighted]:bg-red-200/50 group-data-[disabled]:text-mauve8">
                            ⌘ R
                        </div>
                    </MenubarItem>
                    <MenubarItem
                        class="group text-[13px] leading-none text-neutral-900 dark:text-neutral-50 rounded flex items-center h-[25px] px-[10px] relative select-none pl-5 outline-none data-[state=open]:bg-green4 data-[highlighted]:bg-gradient-to-br data-[highlighted]:from-green9 data-[highlighted]:to-green10 data-[highlighted]:text-green1 data-[highlighted]:data-[state=open]:text-green1 data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none"
                        disabled>
                        Force Reload
                        <div
                            class="ml-auto pl-5 text-neutral-900 dark:text-neutral-50 group-data-[highlighted]:bg-red-200/50 group-data-[disabled]:text-mauve8">
                            ⇧ ⌘ R
                        </div>
                    </MenubarItem>
                    <MenubarSeparator class="h-[0.5px] bg-zinc-950 dark:bg-zinc-50 m-[5px]" />
                    <MenubarItem
                        class="text-[13px] leading-none text-neutral-900 dark:text-neutral-50 rounded flex items-center h-[25px] px-[10px] relative select-none pl-5 outline-none data-[state=open]:bg-green4 data-[highlighted]:bg-gradient-to-br data-[highlighted]:from-green9 data-[highlighted]:to-green10 data-[highlighted]:text-green1 data-[highlighted]:data-[state=open]:text-green1 data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none">
                        Toggle Fullscreen
                    </MenubarItem>
                    <MenubarSeparator class="h-[0.5px] bg-zinc-950 dark:bg-zinc-50 m-[5px]" />
                    <MenubarItem
                        class="text-[13px] leading-none text-neutral-900 dark:text-neutral-50 rounded flex items-center h-[25px] px-[10px] relative select-none pl-5 outline-none data-[state=open]:bg-green4 data-[highlighted]:bg-gradient-to-br data-[highlighted]:from-green9 data-[highlighted]:to-green10 data-[highlighted]:text-green1 data-[highlighted]:data-[state=open]:text-green1 data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none">
                        Hide Sidebar
                    </MenubarItem>
                </MenubarContent>
            </MenubarPortal>
        </MenubarMenu>

        <MenubarMenu v-if="profile" value="profile">
            <MenubarTrigger @mouseenter="handleMouseEnter('profile')"
                class="text-neutral-900 dark:text-neutral-50 px-3 outline-none select-none font-light leading-none rounded text-[13px] flex items-center justify-between gap-[2px] data-[highlighted]:bg-green4 data-[state=open]:bg-green4">
                <MemberAvatar :person="profile" />
            </MenubarTrigger>
            <MenubarPortal>
                <MenubarContent @mouseenter="handleContentMouseEnter" @mouseleave="handleMouseLeave"
                    class="min-w-[240px] outline-none bg-neutral-50 dark:bg-neutral-950 border-[0.5px] border-zinc-600 dark:border-zinc-50 rounded-md p-[5px] shadow-md [animation-duration:_400ms] [animation-timing-function:_cubic-bezier(0.16,_1,_0.3,_1)] will-change-[transform,opacity] z-50"
                    :align="'start'" :side-offset="5" :align-offset="-14" :collision-padding="{ right: 9 }">
                    <MenubarArrow class="fill-zinc-600 dark:fill-neutral-50" />
                    <NuxtLink
                        :to="{ name: 'member-personId', params: { personId: profile.id } }">
                    <MenubarItem
                        class="text-[13px] text-neutral-900 dark:text-neutral-50 rounded flex items-center h-[25px] relative select-none pl-1 outline-none data-[state=open]:bg-green4 data-[highlighted]:bg-gradient-to-br data-[highlighted]:from-green9 data-[highlighted]:to-green10 data-[highlighted]:text-green1 data-[highlighted]:data-[state=open]:text-green1 data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none">
                        <MemberLink :person="profile" classes="p-0" text="View Your Profile" />
                    </MenubarItem>
                    </NuxtLink>
                    <MenubarSeparator class="h-[0.5px] bg-zinc-950 dark:bg-zinc-50 m-[5px]" />
                    <MenubarRadioGroup v-model="person">
                        <p class="text-sm text-zinc-400/90 pl-1">Your Family Trees</p>
                        <MenubarRadioItem
                            v-for="fam in familiesCreatedByMember"
                            :key="fam.id"
                            class="max-w-fit text-[13px] hover:underline leading-none text-neutral-900 dark:text-neutral-50 rounded-[3px] flex items-center h-[25px] px-[5px] relative pl-[20px] select-none outline-none data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:bg-green9 data-[highlighted]:text-green1"
                            :value="`${fam.id}`"
                            :title="`Click to view the ${fam.family_name} tree`"
                        >
                            <NuxtLink
                                :to="{ name: 'member-personId-tree-familyId', params: { personId: profile.id, familyId: fam.id }}"
                                class="max-w-fit"
                            >
                                <MenubarItemIndicator
                                    v-if="family && family.id === fam.id"
                                    class="absolute left-0 w-[20px] inline-flex items-center justify-center">
                                    <Icon icon="radix-icons:dot-filled" />
                                </MenubarItemIndicator>
                                The {{ fam.family_name }} Family
                            </NuxtLink>
                        </MenubarRadioItem>
                        <MenubarItem
                            class="text-[13px] leading-none text-neutral-900 dark:text-neutral-50 rounded flex items-center h-[25px] px-[10px] relative select-none pl-5 outline-none data-[state=open]:bg-green4 data-[highlighted]:bg-gradient-to-br data-[highlighted]:from-green9 data-[highlighted]:to-green10 data-[highlighted]:text-green1 data-[highlighted]:data-[state=open]:text-green1 data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none">
                            <FamilyCreateNewTreeButton />
                        </MenubarItem>
                    </MenubarRadioGroup>
                    <MenubarSeparator class="h-[0.5px] bg-zinc-950 dark:bg-zinc-50 m-[5px]" />
                    <MenubarItem
                        class="text-[13px] leading-none text-neutral-900 dark:text-neutral-50 rounded flex items-center h-[25px] px-[10px] relative select-none pl-5 outline-none data-[state=open]:bg-green4 data-[highlighted]:bg-gradient-to-br data-[highlighted]:from-green9 data-[highlighted]:to-green10 data-[highlighted]:text-green1 data-[highlighted]:data-[state=open]:text-green1 data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none"
                        @click="handleClick">
                        Edit…
                    </MenubarItem>
                    <MenubarSeparator class="h-[0.5px] bg-zinc-950 dark:bg-zinc-50 m-[5px]" />
                    <MenubarItem
                        class="text-[13px] leading-none text-neutral-900 dark:text-neutral-50 rounded flex items-center h-[25px] px-[10px] relative select-none pl-5 outline-none data-[state=open]:bg-green4 data-[highlighted]:bg-gradient-to-br data-[highlighted]:from-green9 data-[highlighted]:to-green10 data-[highlighted]:text-green1 data-[highlighted]:data-[state=open]:text-green1 data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none">
                        Add Profile…
                    </MenubarItem>
                </MenubarContent>
            </MenubarPortal>
        </MenubarMenu>
    </MenubarRoot>
</template>