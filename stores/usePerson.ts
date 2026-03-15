import type { PersonType } from '@/types';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export type QuickAddRelationship = 'child' | 'spouse' | 'parent' | 'sibling' | null;

export const usePersonStore = defineStore('person', () => {
    const person = ref<PersonType | null>(null);
    const searchedForPerson = ref<boolean>(false);
    const selectedPersonInTree = ref<PersonType | null>(null);
    const gotToPersonInTree = ref<PersonType | null>(null);
    const quickAddRelationship = ref<QuickAddRelationship>(null);

    function setPerson(newPerson: PersonType) {
        person.value = newPerson;
    }

    function setSearchedForPerson(bool: boolean) {
        searchedForPerson.value = bool;
        
        setTimeout(() => searchedForPerson.value = false, 4200);
    }

    function setSelectedPersonInTree(person: PersonType) {
        selectedPersonInTree.value = person;
    }

    function clearSelectedPersonInTree() {
        selectedPersonInTree.value = null;
    }

    function setGoToPersonInTree(person: PersonType) {
        gotToPersonInTree.value = person;
    }

    function clearGoToPersonInTree() {
        gotToPersonInTree.value = null;
    }

    function triggerQuickAdd(person: PersonType, relationship: QuickAddRelationship) {
        selectedPersonInTree.value = person;
        quickAddRelationship.value = relationship;
    }

    function clearQuickAdd() {
        quickAddRelationship.value = null;
    }

    return {
        person,
        searchedForPerson,
        selectedPersonInTree,
        gotToPersonInTree,
        quickAddRelationship,
        setPerson,
        setSearchedForPerson,
        setSelectedPersonInTree,
        clearSelectedPersonInTree,
        setGoToPersonInTree,
        clearGoToPersonInTree,
        triggerQuickAdd,
        clearQuickAdd,
    }
})