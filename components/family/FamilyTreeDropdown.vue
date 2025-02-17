<script setup lang="ts">
import type { PropType } from 'vue';
import FamilyTreeDropdown from './FamilyTreeDropdown.vue';
import { type FamilyTreeNodeType } from '@/types/family';

const { treeNode } = defineProps({
    treeNode: {
        type: {} as PropType<FamilyTreeNodeType | null>,
        required: true,
    },
});
</script>

<template>
    <div v-if="treeNode" class="border border-transparent rounded-md p-1">
        <p class="my-2 select-none dark:text-white">
            {{treeNode.level === 1 ? 'Eldest: ' : ''}}
            <VisitPersonLink :person="treeNode.member"/>
        </p>
        <p v-if="treeNode.spouse" class="my-2 select-none dark:text-white">Spouse: <VisitPersonLink :person="treeNode.spouse"/></p>

        <div v-if="treeNode.marriages.length > 0" class="my-2">
            <details>
                <summary class="w-fit rounded-md p-1 cursor-pointer dark:text-white dark:hover:bg-neutral-600 hover:bg-neutral-200 select-none" :style="{ marginLeft: `1.5rem` }" :title="'Past Marriages of ' + treeNode.member.first_name">Past Marriages With:</summary>
                <ul :style="{ paddingLeft: `${(treeNode.level + 1) * 1}rem` }">
                    <li v-for="(spouse, i) in treeNode.marriages" :key="spouse.id" class="w-fit my-2">
                        <VisitPersonLink :person="spouse"/>
                    </li>
                </ul>
            </details>
        </div>

        <div v-if="treeNode.children.length > 0" class="my-2">
            <details>
                <summary class="w-fit rounded-md p-1 cursor-pointer dark:text-white dark:hover:bg-neutral-600 hover:bg-neutral-200 select-none" :style="{ marginLeft: `1.5rem` }" :title="'Children of ' + treeNode.member.first_name">Children</summary>
                <ul :style="{ paddingLeft: `${(treeNode.level + 1) * 1}rem` }">
                    <li v-for="child in treeNode.children" :key="child.member.id" class="w-fit mb-2">
                        <FamilyTreeDropdown :treeNode="child" />
                    </li>
                </ul>
            </details>
        </div>
    </div>
</template>