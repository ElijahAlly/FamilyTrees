import { onMounted, ref, watch } from 'vue';
import { useFamilyStore } from '@/stores/family';
import type { FetchTypeList } from '@/types/fetch';
import { type MarriageType } from '@/types/marriage';
import { type PersonType } from '@/types/person';
import { type FamilyTreeNodeType, type FamilyType } from '@/types/family';
import { removeDuplicateTrees } from '@/utils/family'
import { useRoute } from 'nuxt/app';
import { storeToRefs } from 'pinia';

type MarriageMap = Map<number, MarriageType[]>;
type MembersMap = Map<number, PersonType>;

export function useWatchFamilyStore() {
    const familyStore = useFamilyStore();
    const { setLoadingFamily, setCurrentFamilyTree, updateFamilyTrees } = familyStore;
    const { family, loadingFamily } = storeToRefs(familyStore);

    onMounted(() => {
        if (!loadingFamily.value) {
            setLoadingFamily(true);
            const route = useRoute();
            const isOnFamilyTreePage = !!(route.params?.familyName && route.params?.familyId);
            // console.time('family-tree-data-fetching-and-building-start')
            getFamiliyTreeOrTrees(route, isOnFamilyTreePage);
        }
    })
    
    watch(family, async (newFamily, oldFamilyName) => {
        if (!loadingFamily.value) {
            // console.time('family-tree-data-fetching-and-building-start')
            setLoadingFamily(true);
            await getFamiliyTreeOrTrees();
        }
    });

    const getFamiliyTreeOrTrees = async (route?: any, isOnFamilyTreePage?: boolean) => {
        try {
            const familyMembers: PersonType[] | undefined = await getFamilyMembers(route, isOnFamilyTreePage);

            if (!familyMembers) throw Error('No family members found');

            if (familyMembers && family.value?.id) {
                try {
                    // Fetch all marriages at once instead of per member
                    const allMarriages: MarriageType[] | undefined = await getMarriages(familyMembers);

                    if (!allMarriages) throw Error('No marriages found');

                    // Create a map of marriages for quick lookup
                    const marriageMap = new Map() as MarriageMap;
                    allMarriages.forEach(marriage => {
                        [marriage.person1_id, marriage.person2_id].forEach(personId => {
                            if (!marriageMap.has(personId)) {
                                marriageMap.set(personId, []);
                            }
                            marriageMap.get(personId)?.push(marriage);
                        });
                    });

                    // Create a map of members for quick lookup
                    const membersMap = new Map() as MembersMap;
                    familyMembers.forEach(member => {
                        membersMap.set(member.id, member);
                    });

                    // console.timeLog('family-tree-data-fetching-and-building-start', ['familyMembers', familyMembers])
                    const allTrees = await constructFamilyTrees(familyMembers, marriageMap, membersMap);
                    // console.timeLog('family-tree-data-fetching-and-building-start', ['allTrees', allTrees])
                    const uniqueTrees = removeDuplicateTrees(allTrees);
                    // console.timeLog('family-tree-data-fetching-and-building-start', ['uniqueTrees', uniqueTrees])
                    // console.timeEnd('family-tree-data-fetching-and-building-start')
                    updateFamilyTrees(uniqueTrees);

                    // Only set the current family tree right away if on a specific families page. Needed for when the persisted state is cleared.
                    if (isOnFamilyTreePage) setCurrentFamilyTree(uniqueTrees[0]);
                } catch (err) {
                    console.error(err);
                } finally {
                    setLoadingFamily(false);
                }
            }
        } catch (err) {
            console.error(err);
        }  finally {
            setLoadingFamily(false);
        }
    }

    const constructFamilyTrees = async (
        members: PersonType[], 
        marriageMap: MarriageMap, 
        membersMap: MembersMap
    ): Promise<FamilyTreeNodeType[]> => {
        const startingMembers = members.filter(member => member.father_id === null && member.mother_id === null);
        const familyTrees: FamilyTreeNodeType[] = [];

        for (const startingMember of startingMembers) {
            const tree = buildTreeRecursively(startingMember, members, marriageMap, membersMap, 0);
            familyTrees.push(tree);
        }

        return familyTrees;
    };

    const buildTreeRecursively = (
        currentMember: PersonType, 
        members: PersonType[], 
        marriageMap: MarriageMap, 
        membersMap: MembersMap, 
        currentLevel: number
    ): FamilyTreeNodeType => {
        currentLevel++;
        const children = members
            .filter(member => member.father_id === currentMember.id || member.mother_id === currentMember.id)
            .map(member => buildTreeRecursively(member, members, marriageMap, membersMap, currentLevel))

        let marriagesExcludingCurrentSpouse: PersonType[] = [];
        let spouse: PersonType | null = null;

        const memberMarriages = marriageMap.get(currentMember.id) || [];
        const spouses: PersonType[] = memberMarriages
            .map(marriage => {
                const spouseId = marriage.person1_id === currentMember.id
                    ? marriage.person2_id
                    : marriage.person1_id;
                return membersMap.get(spouseId);
            })
            .filter((spouse): spouse is PersonType => spouse !== undefined);

        if (spouses.length > 0) {
            const currentSpouseIndex = spouses.findIndex(spouse =>
                memberMarriages.some(marriage =>
                    (marriage.person1_id === spouse.id || marriage.person2_id === spouse.id)
                    && !marriage.divorce_date
                )
            );

            if (currentSpouseIndex !== -1) {
                spouse = spouses[currentSpouseIndex];
                spouses.splice(currentSpouseIndex, 1);
            }
            marriagesExcludingCurrentSpouse = spouses;
        }

        return {
            member: currentMember,
            marriages: marriagesExcludingCurrentSpouse,
            spouse,
            level: currentLevel,
            children,
            familyId: familyStore.getFamilyByPerson(currentMember)?.id || 0
        };
    };

    const getFamilyMembers = async (route?: any, isOnFamilyTreePage?: boolean): Promise<PersonType[] | undefined> => {
        try {
            if (isOnFamilyTreePage) {
                // Only fetch 1 family tree (all members in the family)
                const { data: familyResData, error: familyError }: FetchTypeList<FamilyType> = await $fetch('/api/get-family-by-id', {
                    method: 'GET',
                    params: {
                        table: 'families',
                        select: '*',
                        eq: ['id', 'family_name'],
                        id: Number(route.params.familyId),
                        family_name: route.params.familyName
                    }
                });

                if (familyError) throw familyError;

                if (familyResData.length) {
                    familyStore.setFamily(familyResData[0]);
                } else {
                    throw Error('Family not found');
                }

                const { data: membersResData, error: membersError }: FetchTypeList<PersonType> = await $fetch('/api/get-family-members-by-ids', {
                    method: 'GET',
                    params: {
                        table: 'people',
                        select: '*',
                        column: 'id',
                        ids: familyResData[0].members
                    }
                });
                if (membersError) throw membersError;

                familyStore.updateFamilies(familyResData[0]);
                return membersResData;
                
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
                return data;
            }

        } catch (err) {
            throw err;
        }
    };

    const getMarriages = async (families: PersonType[]): Promise<MarriageType[] | undefined> => {
        try {
            const { data: allMarriages, error: marriageError }: FetchTypeList<MarriageType> = await $fetch('/api/get-marriages-bulk', {
                method: 'GET',
                params: {
                    table: 'marriages',
                    select: '*',
                    memberIds: families.map(f => f.id).join(',')
                }
            });

            if (marriageError) throw marriageError;
            return allMarriages;
        } catch (err) {
            throw err;
        }
    }
}