import type { FamilyTreeNodeType, FamilyType } from '@/types/family';
import type { PersonType } from '@/types/person';
import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export const useFamilyStore = defineStore('family', () => {
    const family = ref<FamilyType | null>(null);
    const familyTrees = ref<FamilyTreeNodeType[]>([]);
    const families = ref<FamilyType[]>([]);
    const curentFamilyTree = ref<FamilyTreeNodeType | null>(null);
    const searchedForFamily = ref<boolean>(false);
    const shownFamilyDetails = ref<boolean>(false);
    const loadingFamily = ref<boolean>(false);

    function setLoadingFamily(bool: boolean) {
        loadingFamily.value = bool;
    }

    function setFamily(newFamily: FamilyType) {
        family.value = newFamily;
    }

    function updateFamilyTrees(newTrees: FamilyTreeNodeType[]) {
        familyTrees.value = newTrees;
    }

    function getFamilyByPerson(person: PersonType): FamilyType | null {
        return families.value.filter(tree => tree.members.some(id => id  === person.id))[0] || null;
    }

    function updateFamilies(family: FamilyType) {
        if (families.value.every(f => f.id !== family.id)) {
            families.value.push(family);
        }
    }

    function setCurrentFamilyTree(newFamily: FamilyTreeNodeType) {
        curentFamilyTree.value = newFamily;
    }

    function setSearchedForFamily(bool: boolean) {
        searchedForFamily.value = bool;
        
        setTimeout(() => {
            watch(() => familyTrees.value, () => searchedForFamily.value = false)
        }, 2100);
        setTimeout(() => searchedForFamily.value = false, 4200);
    }

    function setShownFamilyDetails(bool: boolean) {
        shownFamilyDetails.value = bool;
    }

    return {
        family,
        familyTrees,
        curentFamilyTree,
        searchedForFamily,
        families,
        shownFamilyDetails,
        loadingFamily,
        setFamily,
        updateFamilyTrees,
        getFamilyByPerson,
        updateFamilies,
        setCurrentFamilyTree,
        setSearchedForFamily,
        setShownFamilyDetails,
        setLoadingFamily
    }
}, {
    persist: {
        key: 'family',
        pick: [
            'shownFamilyDetails',
        ],
    }
})