export type MarriageType = {
    id: number;
    person1Id: number;
    person2Id: number;
    marriageDate: Date;
    divorceDate: Date;

    // Additional details
    location: string;
    marriageType?: 'civil' | 'religious' | 'common-law' | 'unknown';
    documents: string[];
    
    createdBy: number;
    createdAt: Date;
    updatedAt: Date;
}