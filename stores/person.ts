import type { PersonType } from '@/types/person';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const usePersonStore = defineStore('person', {
    state: () => {
        const person = ref<PersonType | null>(null);
        const searchedForPerson = ref<boolean>(false);
        const selectedPersonInTree = ref<PersonType | null>(null);
        const gotToPersonInTree = ref<PersonType | null>(null);
    
        return {
            person,
            searchedForPerson,
            selectedPersonInTree,
            gotToPersonInTree
        }
    },
    actions: {
        setPerson(newPerson: PersonType) {
            this.person = newPerson;
        },
        setSearchedForPerson(bool: boolean) {
            this.searchedForPerson = bool;
            
            setTimeout(() => this.searchedForPerson = false, 4200);
        },
        setSelectedPersonInTree(person: PersonType) {
            this.selectedPersonInTree = person;
        },
        clearSelectedPersonInTree() {
            this.selectedPersonInTree = null;
        },
        setGoToPersonInTree(person: PersonType) {
            this.gotToPersonInTree = person;
        },
        clearGoToPersonInTree() {
            this.gotToPersonInTree = null;
        },
    },
    getters: {
        getSelectedPersonInTree(): PersonType | null {
            return this.selectedPersonInTree;
        }
    },
    persist: true
})