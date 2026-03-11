import type { FamilyTreeNodeType, FamilyType, PersonType } from '@/types';
import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';

export const useFamilyStore = defineStore('family', () => {
    // Family Type (Current and All)
    const family = ref<FamilyType | null>(null);
    const families = ref<FamilyType[]>([]);
    const isFamilyTreePrivate = computed<boolean>(() => family.value?.visibility === 'private');

    // Family Tree Node Type (Current and All)
    const familyTrees = ref<FamilyTreeNodeType[]>([]);
    const currentFamilyTree = ref<FamilyTreeNodeType | null>(null);

    // Discover Page
    const searchedForFamily = ref<boolean>(false);
    const searchedInput = ref<string>('');

    // Family Tree Page
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
        return families.value.filter(tree => {
            if (!tree.members) return false;
            return tree.members.some(id => id  === person.id)
        })[0] || null;
    }

    function updateFamilies(family: FamilyType) {
        if (families.value.every(f => f.id !== family.id)) {
            families.value.push(family);
        }
    }

    function setCurrentFamilyTree(newFamily: FamilyTreeNodeType) {
        currentFamilyTree.value = newFamily;
    }

    function setSearchedForFamily(bool: boolean) {
        searchedForFamily.value = bool;
        
        setTimeout(() => {
            watch(() => familyTrees.value, () => searchedForFamily.value = false)
        }, 2100);
        setTimeout(() => searchedForFamily.value = false, 4200);
    }

    function searchedInputChanged(newInput: string) {
        searchedInput.value = newInput;
    }

    function setShownFamilyDetails(bool: boolean) {
        shownFamilyDetails.value = bool;
    }

    const clearStoresAfterSignout = () => {
        family.value = null;
        families.value = [];
        familyTrees.value = [];
        currentFamilyTree.value = null;
        searchedForFamily.value = false;
        searchedInput.value = '';
        shownFamilyDetails.value = false;
        loadingFamily.value = false;
    }

    return {
        family,
        familyTrees,
        currentFamilyTree,
        searchedForFamily,
        families,
        shownFamilyDetails,
        loadingFamily,
        searchedInput,
        isFamilyTreePrivate,
        setFamily,
        updateFamilyTrees,
        getFamilyByPerson,
        updateFamilies,
        setCurrentFamilyTree,
        setSearchedForFamily,
        setShownFamilyDetails,
        setLoadingFamily,
        searchedInputChanged,
        clearStoresAfterSignout
    }
}, {
    persist: {
        key: 'family',
        pick: [
            'family',
            'families',
            'searchedForFamily',
            'searchedInput',
            'shownFamilyDetails',
        ],
    }
})