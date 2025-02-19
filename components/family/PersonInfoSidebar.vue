<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { Icon } from '@iconify/vue';
import { usePersonStore } from '@/stores/person';

const personStore = usePersonStore();
const { clearSelectedPersonInTree, setGoToPersonInTree } = personStore;
const { selectedPersonInTree } = storeToRefs(personStore);

const collapsed = ref(false);
const collapsedStyles = ref('');
const computedClass = computed(() => `${selectedPersonInTree.value ? 'bg-neutral-50 dark:bg-zinc-950' : 'bg-transparent pointer-events-none'} ${size.value === 'md' ? 'min-w-[330px]' : 'min-w-[600px]'}`);
const TEXT_CLASS = "dark:text-white cursor-text select-text";

const size = ref<'md' | 'lg'>('md');
const SIZE_CLASS = 'px-2 py-1 cursor-pointer text-zinc-950 dark:text-zinc-50 hover:bg-zinc-300 dark:hover:bg-zinc-700';
const SIZE_ACTIVE_CLASS = 'bg-zinc-400 hover:bg-zinc-400 dark:bg-zinc-600 dark:hover:bg-zinc-600';
const mediumClass = computed(() => size.value === 'md' ? `${SIZE_ACTIVE_CLASS} rounded-l-md` : 'rounded-l-md');
const largeClass = computed(() => size.value === 'lg' ? `${SIZE_ACTIVE_CLASS} rounded-r-md` : 'rounded-r-md');

const blurClass = computed(() => `transition-all duration-300 ${collapsed.value ? 'blur-md ml-6' : ''}`);

const toggleSize = (newVal?: 'md' | 'lg') => {
    if (!newVal) {
        size.value = size.value === 'md' ? 'lg' : 'md';
    } else {
        size.value = newVal;
    }
}

const toggleCollapsed = (newVal?: 'show' | 'hide') => {
    if (!newVal) {
        collapsed.value = !collapsed.value;
    } else {
        collapsed.value = newVal === 'show' ? false : true;
    }
}

watch(() => selectedPersonInTree.value, (newVal) => {
    if (newVal && collapsed.value) {
        collapsed.value = false;
    }
});

watch(collapsed, (newValue) => {
    if (newValue) {
        collapsedStyles.value = '';
        setTimeout(() => {
            collapsedStyles.value = 'hover:bg-zinc-300 dark:hover:bg-zinc-900 hover:text-white cursor-pointer';
        }, 300)
    } else {
        collapsedStyles.value = '';
    }
});
</script>

<template>
    <div
        v-if="selectedPersonInTree"
        class="h-full flex flex-col justify-between absolute top-0 right-0 transition-transform duration-300 ease-in-out p-2 z-20 border-l border-zinc-400 dark:border-zinc-600 shadow-lg shadow-zinc-300 dark:shadow-zinc-500"
        :class="[
            computedClass, 
            collapsedStyles
        ]" 
        @click.stop="() => collapsed && toggleCollapsed('show')"
        :style="{
            transform: collapsed ? `translateX(${size === 'md' ? '282' : '552'}px)` : 'translateX(0)', 
        }" 
    >
        <div>
            <div class="flex w-full justify-between">
                <span class="rounded-md border-black dark:border-white hover:border-zinc-400 dark:hover:border-zinc-200" :class="collapsed ? 'ml-[-6px]' : 'border'">
                    <Icon
                        v-if="collapsed"
                        icon="ri:arrow-left-double-fill" 
                        class="h-12 w-fit dark:text-white cursor-pointer"
                        @click.stop="() => toggleCollapsed('show')"
                    />
                    <Icon
                        v-else
                        icon="ri:arrow-right-double-fill" 
                        class="h-12 w-fit dark:text-white hover:text-zinc-400 dark:hover:text-zinc-200 cursor-pointer"
                        @click.stop="toggleCollapsed"
                    />
                </span>
                <span 
                    class="flex items-center justify-center p-2 text-black dark:text-white hover:text-red-500 dark:hover:text-red-400 cursor-pointer border border-black dark:border-white hover:border-red-500 dark:hover:border-red-400 rounded-md" 
                    @click.stop="clearSelectedPersonInTree"
                >
                    Close
                    <Icon
                        icon="ri:close-circle-line" 
                        class="h-6 w-fit ml-2 text-inherit cursor-pointer"
                    />
                </span>
            </div>
            <hr class="mt-3 border-zinc-500 dark:border-200 border-dashed" :class="[collapsed ? 'blur-md' : '']" />
            <div class="relative">
                <transition name="fade" mode="out-in">
                    <div
                        :class="[blurClass]"
                        :key="selectedPersonInTree.id"
                    >
                        <NuxtLink :to="{ name: 'familyName-member-personId', params: { familyName: selectedPersonInTree.last_name, personId: selectedPersonInTree.id }}">
                            <div class="w-full flex justify-center items-center text-lg hover:text-xl font-normal hover:font-medium text-zinc-950 dark:text-zinc-50 p-2 border-b transition-all duration-300 hover:bg-zinc-300 dark:hover:bg-zinc-800">
                                View Person's Page
                                <Icon icon="grommet-icons:link-next" class="w-3 h-3 ml-2" /> 
                            </div>
                        </NuxtLink>
                        <p :class="[TEXT_CLASS]">First Name: {{ selectedPersonInTree.first_name }}</p>
                        <p :class="[TEXT_CLASS]">Last Name: {{ selectedPersonInTree.last_name }}</p>
                        <p :class="[TEXT_CLASS]">Birth Date: {{ selectedPersonInTree.birth_date }}</p>
                        <button 
                            @click.stop="setGoToPersonInTree(selectedPersonInTree)"
                            class="text-black dark:text-white mt-2 p-2 border border-black dark:border-white outline-none focus:outline-none rounded-md"
                        >
                            <- Go to Person in Tree
                        </button>
                    </div>
                </transition>
            </div>
        </div>
        <div class="border-t w-full py-3" :class="[blurClass]">
            <div class="flex items-center">
                <span class="mr-2 text-black dark:text-white">Size:</span>
                <div class="flex items-center justify-center border rounded-md">
                    <span :class="[SIZE_CLASS, mediumClass]" @click="toggleSize('md')">Medium</span>
                    <div class="text-zinc-300 dark:text-zinc-600">|</div>
                    <span :class="[SIZE_CLASS, largeClass]" @click="toggleSize('lg')">Large</span>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.24s ease-in-out;
}

.fade-enter-from {
  opacity: 0;
  transform: translateX(3px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateX(-3px);
}
</style>