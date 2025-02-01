import type { FamilyTreeNodeType } from "@/types/family";

export const collectMemberIds = (node: FamilyTreeNodeType): Set<number> => {
    const memberIds: Set<number> = new Set();

    const traverseTree = (node: FamilyTreeNodeType) => {
        memberIds.add(node.member.id);
        node.children.forEach(child => traverseTree(child));

        if (node.spouse) {
            memberIds.add(node.spouse.id);
        }

        node.marriages.forEach(marriage => {
            memberIds.add(marriage.id);
        });
    };

    traverseTree(node);
    return memberIds;
};

export const removeDuplicateTrees = (trees: FamilyTreeNodeType[]): FamilyTreeNodeType[] => {
    const processedMembers = new Map<number, { tree: FamilyTreeNodeType, size: number }>();
    const uniqueTrees: FamilyTreeNodeType[] = [];

    trees.forEach(tree => {
        const memberIds = collectMemberIds(tree);
        const treeSize = memberIds.size;

        // Check if all members are already part of a larger tree
        const shouldAddTree = !Array.from(memberIds).some(id => {
            const existingTreeData = processedMembers.get(id);
            return existingTreeData && existingTreeData.size >= treeSize;
        });

        if (shouldAddTree) {
            // Add this tree to the uniqueTrees and update the processedMembers map
            uniqueTrees.push(tree);

            // Mark all members in this tree as processed
            memberIds.forEach(id => {
                processedMembers.set(id, { tree, size: treeSize });
            });
        }
    });

    return uniqueTrees;
};