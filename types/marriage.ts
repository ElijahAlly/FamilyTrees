export type MarriageType = {
    id: number;
    person1_id: number;
    person2_id: number;
    marriage_date: Date;
    divorce_date: Date;

    // Additional details
    location: string;
    marriageType?: 'civil' | 'religious' | 'common-law' | 'unknown';
    documents: string[];
    
    createdBy: number;
    createdAt: Date;
    updatedAt: Date;
}