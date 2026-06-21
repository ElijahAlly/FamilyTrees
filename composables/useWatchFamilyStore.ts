import { onMounted } from 'vue';
import { useFamilyStore } from '../stores/useFamily';
import type { FetchTypeList, MarriageType, PersonType, FamilyTreeNodeType, FamilyType } from '@/types';
import { removeDuplicateTrees } from '../utils/family'
import { storeToRefs } from 'pinia';
import { useRoute } from 'nuxt/app';

type MarriageMap = Map<number, MarriageType[]>;
type MembersMap = Map<number, PersonType>;

export function useWatchFamilyStore() {
    const familyStore = useFamilyStore();
    const { setLoadingFamily, setCurrentFamilyTree, updateFamilyTrees } = familyStore;
    const { family, loadingFamily } = storeToRefs(familyStore);
    const route = useRoute();
    const isOnFamilyTreePage = computed<boolean>(() => !!(route.params?.personId && route.params?.familyId));

    onMounted(() => {
        if (!loadingFamily.value) {
            setLoadingFamily(true);
            // console.time('family-tree-data-fetching-and-building-start')
            getFamiliyTreeOrTrees();
        }
    })
    
    // watch(family, async (_newFamily, _oldFamilyName) => {
    //     if (!loadingFamily.value) {
    //         // console.time('family-tree-data-fetching-and-building-start')
    //         setLoadingFamily(true);
    //         await getFamiliyTreeOrTrees();
    //     }
    // });

    const getFamiliyTreeOrTrees = async () => {
        try {
            const familyMembers: PersonType[] | undefined = await getFamilyMembers();

            if (!familyMembers) throw Error('No family members found');

            if (familyMembers.length > 0 && family.value?.id) {
                try {
                    // Fetch all marriages at once instead of per member
                    const allMarriages: MarriageType[] | undefined = await getMarriages(familyMembers);

                    if (!allMarriages) throw Error('No marriages found');

                    // Create a map of marriages for quick lookup
                    const marriageMap = new Map() as MarriageMap;
                    allMarriages.forEach(marriage => {
                        [marriage.person1Id, marriage.person2Id].forEach(personId => {
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
                    if (isOnFamilyTreePage.value) setCurrentFamilyTree(uniqueTrees[0]);
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
        const startingMembers = members.filter(member => member.fatherId === null && member.motherId === null);
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
            .filter(member => member.fatherId === currentMember.id || member.motherId === currentMember.id)
            .sort((a, b) => {
                // Sort by birth date ascending (oldest first = leftmost in tree)
                if (a.birthDate && b.birthDate) return a.birthDate.localeCompare(b.birthDate);
                if (a.birthDate) return -1; // has date comes first
                if (b.birthDate) return 1;
                return 0; // preserve original order if no dates
            })
            .map(member => buildTreeRecursively(member, members, marriageMap, membersMap, currentLevel))

        let marriagesExcludingCurrentSpouse: PersonType[] = [];
        let spouse: PersonType | null = null;

        const memberMarriages = marriageMap.get(currentMember.id) || [];
        const spouses: PersonType[] = memberMarriages
            .map(marriage => {
                const spouseId = marriage.person1Id === currentMember.id
                    ? marriage.person2Id
                    : marriage.person1Id;
                return membersMap.get(spouseId);
            })
            .filter((spouse): spouse is PersonType => spouse !== undefined);

        if (spouses.length > 0) {
            const currentSpouseIndex = spouses.findIndex(spouse =>
                memberMarriages.some(marriage =>
                    (marriage.person1Id === spouse.id || marriage.person2Id === spouse.id)
                    && !marriage.divorceDate
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

    const getFamilyMembers = async (): Promise<PersonType[] | undefined> => {
        if (isOnFamilyTreePage.value) {
            // Only fetch 1 family tree (all members in the family)
            const { data: familyResData, error: familyError }: FetchTypeList<FamilyType> = await $fetch('/api/get-family-by-id', {
                method: 'GET',
                params: {
                    table: 'families',
                    select: '*',
                    eq: 'id',
                    id: Number(route.params.familyId),
                }
            });

            if (familyError) throw familyError;

            if (familyResData.length) {
                familyStore.setFamily(familyResData[0]);
            } else {
                throw Error('Family not found');
            }

            const members = familyResData[0].members;
            if (!members || members.length === 0) {
                familyStore.updateFamilies(familyResData[0]);
                return [];
            }

            const { data: membersResData, error: membersError }: FetchTypeList<PersonType> = await $fetch('/api/get-family-members-by-ids', {
                method: 'GET',
                params: {
                    table: 'people',
                    select: '*',
                    column: 'id',
                    ids: members
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
                    familyName: familyStore.family.familyName
                }
            });
            if (error) throw error;
            return data;
        }
    };

    const getMarriages = async (families: PersonType[]): Promise<MarriageType[] | undefined> => {
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
    }

    /**
     * Public method to refresh the family tree data without a full page reload.
     */
    const refreshFamilyTree = async () => {
        setLoadingFamily(true);
        await getFamiliyTreeOrTrees();
    };

    return { refreshFamilyTree };
}