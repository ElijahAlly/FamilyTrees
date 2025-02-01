import type { PersonType } from "./person";

export type FamilyType = {
    id: number;
    family_name: string;
    members: number[];
}

export type FamilyTreeNodeType = {
    member: PersonType;
    marriages: PersonType[];
    spouse: PersonType | null;
    children: FamilyTreeNodeType[];
    familyId: number;
    level: number;
}

export const _defaultFamilyTree = {
    member: {
        id: 0,
        first_name: '',
        last_name: '',
        birth_date: '',
        death_date: null,
        gender: 'U', // not getting recognized
        mother_id: null,
        father_id: null,
        middle_name:null,
    },
    marriages: [],
    spouse: null,
    children: [],
    level: 0, 
}