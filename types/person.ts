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