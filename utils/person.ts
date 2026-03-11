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
    return `${person.first_name} ${person.middle_name ? person.middle_name + ' ' : ''}${person.last_name}`;
}

export const getFirstAndLastName = (person: PersonType | null | undefined) => {
    if (!person) return '';
    return `${person.first_name} ${person.last_name}`;
}
