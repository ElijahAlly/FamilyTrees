import type { GenderType, PersonType } from "@/types";

export const getGenderLabel = (genderChar: GenderType | null | undefined) => {
    if (!genderChar) return '';
    switch (genderChar) {
        case 'M':
            return 'Male';
        case 'F':
            return 'Female';
        case 'N':
            return 'Non Binary';
        default:
            return 'Unspecified';
    }
}

export const getFullName = (person: PersonType | null | undefined) => {
    if (!person) return '';
    return `${person.firstName} ${person.middleName ? person.middleName + ' ' : ''}${person.lastName}`;
}

export const getFirstAndLastName = (person: PersonType | null | undefined) => {
    if (!person) return '';
    return `${person.firstName} ${person.lastName}`;
}
