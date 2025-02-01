import type { FamilyTreeNodeType, FamilyType } from '@/types/family';
import type { PersonType } from '@/types/person';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useFamilyStore = defineStore('family', {
    state: () => {
        const family = ref<FamilyType | null>(null);
        const familyTrees = ref<FamilyTreeNodeType[]>([]);
        const families = ref<FamilyType[]>([]);
        const curentFamilyTree = ref<FamilyTreeNodeType | null>(null);
        const searchedForFamily = ref<boolean>(false);
    
        return {
            family,
            familyTrees,
            curentFamilyTree,
            searchedForFamily,
            families
        }
    },
    actions: {
        setFamily(newFamily: FamilyType) {
            this.family = newFamily;
        },
        updateFamilyTrees(newTrees: FamilyTreeNodeType[]) {
            this.familyTrees = newTrees;
        },
        getFamilyByPerson(person: PersonType): FamilyType | null {
            return this.families.filter(tree => tree.members.some(id => id  === person.id))[0] || null;
        },
        updateFamilies(family: FamilyType) {
            if (this.families.every(f => f.id !== family.id)) {
                this.families.push(family);
            }
        },
        setCurrentFamilyTree(newFamily: FamilyTreeNodeType) {
            this.curentFamilyTree = newFamily;
        },
        setSearchedForFamily(bool: boolean) {
            this.searchedForFamily = bool;
            
            setTimeout(() => {
                watch(() => this.familyTrees, () => this.searchedForFamily = false)
            }, 2100);
            setTimeout(() => this.searchedForFamily = false, 4200);
        }
    },
    getters: {
        
    },
    persist: true
})