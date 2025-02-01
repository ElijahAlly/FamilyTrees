export type PersonType = {
    id: number;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    birth_date: string | null;
    death_date: string | null;
    is_living: boolean;
    gender: GenderType;
    mother_id: number | null;
    father_id: number | null;
    pictures: string[];
}

export type GenderType = 'M' | 'F' | 'N' | 'U';

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