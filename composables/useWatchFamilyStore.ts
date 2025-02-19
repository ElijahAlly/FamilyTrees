import { onMounted, watch } from 'vue';
import { useFamilyStore } from '@/stores/family';
import type { FetchTypeList } from '@/types/fetch';
import { type MarriageType } from '@/types/marriage';
import { type PersonType } from '@/types/person';
import { type FamilyTreeNodeType, type FamilyType } from '@/types/family';
import { removeDuplicateTrees } from '@/utils/family'
import { useRoute } from 'nuxt/app';

export function useWatchFamilyStore() {
    const familyStore = useFamilyStore();

    onMounted(() => {
        const route = useRoute();
        const isOnFamilyTreePage = !!(route.params?.familyName && route.params?.familyId);
        getFamiliyTreeOrTrees(route, isOnFamilyTreePage);
    })
    
    watch(() => familyStore.family, async (newFamily, oldFamilyName) => {
        await getFamiliyTreeOrTrees();
    });

    const getFamiliyTreeOrTrees = async (route?: any, isOnFamilyTreePage?: boolean) => {
        try {
            let families: PersonType[] = [];
            if (isOnFamilyTreePage) {
                // Only fetch 1 family tree (all members in the family)
                const { data: familyResData, error: firstError }: FetchTypeList<FamilyType> = await $fetch('/api/get-family-by-id', {
                    method: 'GET',
                    params: {
                        table: 'families',
                        select: '*',
                        eq: 'id',
                        id: Number(route.params.familyId)
                    }
                });

                if (firstError) throw firstError;

                if (familyResData.length) {
                    familyStore.setFamily(familyResData[0]);
                }

                const { data, error }: FetchTypeList<PersonType> = await $fetch('/api/get-family-members-by-ids', {
                    method: 'GET',
                    params: {
                        table: 'people',
                        select: '*',
                        column: 'id',
                        ids: familyResData[0].members
                    }
                });
                if (error) throw error;

                families = data;
                familyStore.updateFamilies(familyResData[0]);
            } else if (familyStore.family) {
                // Fetch ALL family trees (members) based on the last name (used in searches where multiple families can have the same last name)
                const { data, error }: FetchTypeList<PersonType> = await $fetch('/api/get-families-by-name', {
                    method: 'GET',
                    params: {
                        table: 'people',
                        select: '*',
                        eq: 'last_name',
                        familyName: familyStore.family.family_name
                    }
                });
                if (error) throw error;
                families = data;
            }

            if (families && familyStore.family?.id) {
                try {
                    const constructFamilyTrees = async (members: PersonType[]): Promise<FamilyTreeNodeType[]> => {
                        const startingMembers = members.filter(member => member.father_id === null && member.mother_id === null);
                        const familyTrees: FamilyTreeNodeType[] = [];

                        try {
                            for (const startingMember of startingMembers) {
                                const tree = await buildTreeRecursively(startingMember, members, 0);
                                familyTrees.push(tree);
                            }
                        } catch (err) {
                            console.error('Error building family trees:', err);
                        }

                        return familyTrees;
                    };

                    const buildTreeRecursively = async (currentMember: PersonType, members: PersonType[], currentLevel: number): Promise<FamilyTreeNodeType> => {
                        currentLevel++;
                        const children = await Promise.all(
                            members
                                .filter(member => member.father_id === currentMember.id || member.mother_id === currentMember.id)
                                .map(member => buildTreeRecursively(member, members, currentLevel))
                        );

                        let marriagesExcludingCurrentSpouse: PersonType[] = [];
                        let spouse: PersonType | null = null;

                        try {
                            const { data: marriages, error }: FetchTypeList<MarriageType> = await $fetch('/api/get-marriages', {
                                method: 'GET',
                                params: {
                                    table: 'marriages',
                                    select: '*',
                                    or: `person1_id.eq.${currentMember.id}, person2_id.eq.${currentMember.id}`,
                                }
                            });

                            if (error) throw error;

                            if (marriages) {
                                const spousePromises = marriages.map(async (marriage: MarriageType) => {
                                    const spouseId = marriage.person1_id === currentMember.id
                                        ? marriage.person2_id
                                        : marriage.person1_id;

                                    try {
                                        const { data: person, error }: FetchTypeList<PersonType> = await $fetch('/api/get-single-person-from-marriage', {
                                            method: 'GET',
                                            params: {
                                                table: 'people',
                                                select: '*',
                                                eq: 'id',
                                                spouseId: spouseId,
                                            }
                                        });

                                        if (error) throw error;
                                        return person[0];
                                    } catch (err) {
                                        console.error(err);
                                    }
                                });

                                const resolvedSpouses: PersonType[] = (await Promise.all(spousePromises)).filter(person => person !== undefined);

                                const getCurrentSpouse = (spouses: PersonType[]): { curSpouse: PersonType | null, curSpouseIndex: number } => {
                                    const curSpouseIndex = spouses.findIndex(spouse =>
                                        marriages.some((marriage: MarriageType) =>
                                            (marriage.person1_id === spouse.id || marriage.person2_id === spouse.id)
                                            && !marriage.divorce_date
                                        )
                                    );

                                    if (curSpouseIndex === -1) {
                                        return { curSpouse: null, curSpouseIndex: -1 };
                                    } else {
                                        return { curSpouse: spouses[curSpouseIndex], curSpouseIndex: curSpouseIndex };
                                    }
                                }


                                const curSpouseRes = getCurrentSpouse(resolvedSpouses);
                                spouse = resolvedSpouses.length > 0 ? curSpouseRes.curSpouse : null;

                                if (resolvedSpouses.length) {
                                    if (curSpouseRes.curSpouseIndex !== -1) {
                                        resolvedSpouses.splice(curSpouseRes.curSpouseIndex, 1);
                                        marriagesExcludingCurrentSpouse = resolvedSpouses;
                                    } else {
                                        marriagesExcludingCurrentSpouse = resolvedSpouses;
                                    }
                                }
                            }
                        } catch (err) {
                            console.error(err);
                        }

                        return {
                            member: currentMember,
                            marriages: marriagesExcludingCurrentSpouse,
                            spouse,
                            level: currentLevel,
                            children: children,
                            familyId: familyStore.getFamilyByPerson(currentMember)?.id || 0
                        };
                    };

                    const allTrees = await constructFamilyTrees(families);
                    const uniqueTrees = removeDuplicateTrees(allTrees);
                    familyStore.updateFamilyTrees(uniqueTrees);

                    // Only set the current family tree right away if on a specific families page. Needed for when the persisted state is cleared.
                    if (isOnFamilyTreePage) familyStore.setCurrentFamilyTree(uniqueTrees[0]);
                } catch (err) {
                    console.error(err);
                }
            }
        } catch (err) {
            console.error(err);
        }
    }
}