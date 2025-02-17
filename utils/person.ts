
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
    return dateString.split('T')[0].split('-').join('/');
};
