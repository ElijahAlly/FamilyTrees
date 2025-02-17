import type { GenderType, PersonType } from "@/types/person";

export const getGenderLabel = (genderChar: GenderType) => {
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

export const getFullName = (person: PersonType) => {
    return `${person.first_name} ${person.middle_name ? person.middle_name + ' ' : ''}${person.last_name}`;
}

export const getFirstAndLastName = (person: PersonType) => {
    return `${person.first_name} ${person.last_name}`;
}

export const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${dayOfWeek}, ${month} ${day}, ${year}`;
};
