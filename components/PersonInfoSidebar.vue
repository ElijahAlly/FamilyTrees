<script lang="ts" setup>
import { ref, computed } from 'vue';
import { Icon } from '@iconify/vue';
import { usePersonStore } from '@/stores/person';

const personStore = usePersonStore();
const { clearSelectedPersonInTree, setGoToPersonInTree } = personStore;
const { selectedPersonInTree } = storeToRefs(personStore);

const person = computed(() => personStore.getSelectedPersonInTree);
const collapsed = ref(false);
const computedClass = computed(() => `h-full w-[330px] flex flex-col absolute top-0 right-0 transition-transform duration-300 ease-in-out p-2 z-30 border-l border-zinc-400 dark:border-zinc-600 shadow-lg shadow-zinc-300 dark:shadow-zinc-500 ${person.value ? 'bg-neutral-50 dark:bg-zinc-950' : 'bg-transparent pointer-events-none'}`);
const textClass = "dark:text-white cursor-text select-text";

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
</script>

<template>
    <div
        v-if="person"
        :class="[
            computedClass, 
            collapsed ? 'hover:bg-zinc-300 dark:hover:bg-zinc-900 hover:text-white cursor-pointer' : ''
        ]" 
        @click.stop="() => collapsed && toggleCollapsed('show')"
        :style="{
            transform: collapsed ? 'translateX(282px)' : 'translateX(0)', 
        }" 
    >
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
            <span class="flex items-center justify-center p-2 text-black dark:text-white hover:text-red-500 dark:hover:text-red-400 cursor-pointer border border-black dark:border-white hover:border-red-500 dark:hover:border-red-400 rounded-md" @click.stop="clearSelectedPersonInTree">
                Close
                <Icon
                    icon="ri:close-circle-line" 
                    class="h-6 w-fit ml-2 text-inherit cursor-pointer"
                />
            </span>
        </div>
        <hr class="my-6 border-zinc-500 dark:border-200 border-dashed" :class="[collapsed ? 'blur-md' : '']" />
        <div class="relative">
            <transition name="fade" mode="out-in">
                <div
                    :class="['transition-all duration-300', collapsed ? 'blur-md ml-6' : '']"
                    :key="person.id"
                >
                    <p :class="[textClass]">First Name: {{ person.first_name }}</p>
                    <p :class="[textClass]">Last Name: {{ person.last_name }}</p>
                    <p :class="[textClass]">Birth Date: {{ person.birth_date }}</p>
                    <button 
                        @click.stop="setGoToPersonInTree(person)"
                        class="text-black dark:text-white mt-2 p-2 border border-black dark:border-white outline-none focus:outline-none rounded-md"
                    >
                        <- Go to Person in Tree
                    </button>
                </div>
            </transition>
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