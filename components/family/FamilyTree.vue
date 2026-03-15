<script setup lang="ts">
import { onMounted, ref, watch, type PropType } from 'vue';
import * as d3 from 'd3';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { usePersonStore } from '@/stores/usePerson';
import { useDraggableZoneStore } from '@/stores/useDraggableZone';
import type { PersonType, FamilyTreeNodeType } from '@/types';
import { storeToRefs } from 'pinia';
import { getPersonPictureUrl, getLegacyPersonPictureUrl } from '@/utils/pictures';

const { isNative } = useDevice();
const router = useRouter();
const personStore = usePersonStore();
const { setSelectedPersonInTree, clearGoToPersonInTree, triggerQuickAdd } = personStore;
const { gotToPersonInTree, selectedPersonInTree } = storeToRefs(personStore);

const familyStore = useFamilyStore();
const { currentFamilyTree } = storeToRefs(familyStore);

const authStore = useAuthStore();
const { user } = storeToRefs(authStore);

const draggableStore = useDraggableZoneStore();
const { getSecondaryColorByCurrentColor } = draggableStore;
const { treeCustomization } = storeToRefs(draggableStore);

const emit = defineEmits<{
    (e: 'centerNode', position: { x: number, y: number }): void
}>();

// Quick-add button helpers
const isPersonAdult = (attrs: Record<string, any>, hasChildren: boolean): boolean => {
    if (hasChildren) return true;
    if (!attrs.birthDate) return true;
    const birth = new Date(attrs.birthDate as string);
    const now = new Date();
    const age = now.getFullYear() - birth.getFullYear();
    return age >= 18;
};

const canAddParent = (attrs: Record<string, any>): boolean => {
    return !attrs.motherId || !attrs.fatherId;
};

const QUICK_ADD_BTN_RADIUS = 14;
const QUICK_ADD_COLORS = {
    parent: { bg: '#8b5cf6', hover: '#7c3aed', icon: '\u2191' },
    child: { bg: '#10b981', hover: '#059669', icon: '\u2193' },
    sibling: { bg: '#3b82f6', hover: '#2563eb', icon: '\u2194' },
    spouse: { bg: '#f59e0b', hover: '#d97706', icon: '\u2665' },
};

// Node dimensions
const NODE_W = 120;
const NODE_H = 99;
const SPOUSE_GAP = 20;
const SPOUSE_OFFSET_X = NODE_W + SPOUSE_GAP; // 140

interface RawNodeDatum {
    name: string;
    attributes?: Record<string, string | number | boolean>;
    children?: RawNodeDatum[];
}

interface CollapsibleNode extends d3.HierarchyNode<RawNodeDatum> {
    _children?: d3.HierarchyNode<RawNodeDatum>[];
}

const hasSetFamilyTree = ref(false);

const containerRef = ref<HTMLDivElement | null>(null);
const svgRef = ref<SVGSVGElement | null>(null);
const width = ref(900);
const height = ref(900);
const dx = 60;
const dy = 180;

const currentlyCollapsed = ref<{[key: number]: boolean}>({});
const parentNodesOfPersonFound = ref<number[]>([]);

const familyTree = ref<RawNodeDatum | null>(null);

// Lookup map: personId → FamilyTreeNodeType (for spouse/marriage data)
const nodeDataMap = ref<Map<number, FamilyTreeNodeType>>(new Map());

// Ex-spouse expansion state
const expandedExSpouses = ref<Set<number>>(new Set());

const orZero = (num: number | undefined) => {
    return num ? num : 0;
}

const getNodeName = (person: PersonType) => {
    return `${person.firstName} ${person.lastName}`;
}

const ARRAY_TO_STRING_JOINER = '_|-|-|_';

const getAttributes = (node: FamilyTreeNodeType) => ({
    id: node.member.id,
    firstName: node.member.firstName,
    lastName: node.member.lastName,
    middleName: node.member.middleName ? node.member.middleName : '',
    birthDate: node.member.birthDate ? node.member.birthDate : '',
    deathDate: node.member.deathDate ? node.member.deathDate : '',
    isLiving: node.member.isLiving,
    gender: node.member.gender,
    motherId: node.member.motherId ? node.member.motherId : '',
    fatherId: node.member.fatherId ? node.member.fatherId : '',
    pictures: node.member.pictures.join(ARRAY_TO_STRING_JOINER),
    // Spouse data (IDs only — full data looked up from nodeDataMap)
    spouseId: node.spouse ? node.spouse.id : '',
    exSpouseIds: node.marriages.map(m => m.id).join(ARRAY_TO_STRING_JOINER),
})

const getChildren = (treeNode: FamilyTreeNodeType): RawNodeDatum[] => {
    if (treeNode?.children.length === 0) return [];

    const tc = treeCustomization.value;

    if (tc.groupChildrenByGender && treeNode.children.length > 1) {
        // Group children by gender
        const males = treeNode.children.filter(c => c.member.gender === 'M');
        const females = treeNode.children.filter(c => c.member.gender === 'F');
        const other = treeNode.children.filter(c => c.member.gender !== 'M' && c.member.gender !== 'F');

        const groups: RawNodeDatum[] = [];

        if (males.length > 0) {
            groups.push({
                name: `Sons (${males.length})`,
                attributes: {
                    id: -1 * (treeNode.member.id * 100 + 1), // unique negative ID
                    isGenderGroup: true,
                    groupGender: 'M',
                    groupCount: males.length,
                    firstName: `Sons`,
                    lastName: `(${males.length})`,
                    middleName: '',
                    birthDate: '',
                    deathDate: '',
                    isLiving: true,
                    gender: 'M',
                    motherId: '',
                    fatherId: '',
                    pictures: '',
                    spouseId: '',
                    exSpouseIds: '',
                },
                children: males.map(child => ({
                    name: getNodeName(child.member),
                    attributes: getAttributes(child),
                    children: getChildren(child),
                })),
            });
        }

        if (females.length > 0) {
            groups.push({
                name: `Daughters (${females.length})`,
                attributes: {
                    id: -1 * (treeNode.member.id * 100 + 2),
                    isGenderGroup: true,
                    groupGender: 'F',
                    groupCount: females.length,
                    firstName: `Daughters`,
                    lastName: `(${females.length})`,
                    middleName: '',
                    birthDate: '',
                    deathDate: '',
                    isLiving: true,
                    gender: 'F',
                    motherId: '',
                    fatherId: '',
                    pictures: '',
                    spouseId: '',
                    exSpouseIds: '',
                },
                children: females.map(child => ({
                    name: getNodeName(child.member),
                    attributes: getAttributes(child),
                    children: getChildren(child),
                })),
            });
        }

        if (other.length > 0) {
            groups.push({
                name: `Children (${other.length})`,
                attributes: {
                    id: -1 * (treeNode.member.id * 100 + 3),
                    isGenderGroup: true,
                    groupGender: 'U',
                    groupCount: other.length,
                    firstName: `Children`,
                    lastName: `(${other.length})`,
                    middleName: '',
                    birthDate: '',
                    deathDate: '',
                    isLiving: true,
                    gender: 'U',
                    motherId: '',
                    fatherId: '',
                    pictures: '',
                    spouseId: '',
                    exSpouseIds: '',
                },
                children: other.map(child => ({
                    name: getNodeName(child.member),
                    attributes: getAttributes(child),
                    children: getChildren(child),
                })),
            });
        }

        return groups;
    }

    return treeNode.children.map((child) => ({
        name: getNodeName(child.member),
        attributes: getAttributes(child),
        children: getChildren(child)
    }));
}

// Build nodeDataMap by walking the FamilyTreeNodeType recursively
const buildNodeDataMap = (node: FamilyTreeNodeType, map: Map<number, FamilyTreeNodeType>) => {
    map.set(node.member.id, node);
    for (const child of node.children) {
        buildNodeDataMap(child, map);
    }
};

const getInitials = (firstName: string, lastName: string) => {
    const firstInitial = firstName.charAt(0);
    const lastInitial = lastName.charAt(0);
    return `${firstInitial}${lastInitial}`.toUpperCase();
};

const getInitialsFromNode = (d: d3.HierarchyNode<RawNodeDatum>) => {
    const firstName = d.data.attributes?.firstName as string || '';
    const lastName = d.data.attributes?.lastName as string || '';
    return getInitials(firstName, lastName);
};

const createInitialsSvg = (initials: string) => {
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="20" fill="#a78bfa"/>
        <text
            x="50%"
            y="50%"
            dy=".1em"
            fill="white"
            font-family="Arial"
            font-size="16"
            text-anchor="middle"
            dominant-baseline="middle"
        >${initials}</text>
    </svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

// Helper: get image URL for a person
const getPersonImageUrl = (person: PersonType): string => {
    if (person.pictures?.length && currentFamilyTree.value) {
        const firstPic = person.pictures[0];
        if (/^\d+$/.test(firstPic)) {
            return getPersonPictureUrl(firstPic, 'thumb');
        }
        return getLegacyPersonPictureUrl(currentFamilyTree.value.familyId, person.id, firstPic);
    }
    return createInitialsSvg(getInitials(person.firstName, person.lastName));
};

const renderTree = () => {
    if (!familyTree.value || !svgRef.value || !containerRef.value) return;

    let svg = d3.select(svgRef.value);
    if (svg.select("g").empty()) {
        svg.selectAll("*").remove();
        const g = svg.append("g");

        g.append("g").attr("class", "links");
        g.append("g").attr("class", "marriage-links");
        g.append("g").attr("class", "spouse-links");
        g.append("g").attr("class", "nodes");
        g.append("g").attr("class", "spouses");
        g.append("g").attr("class", "ex-spouses");
        g.append("g").attr("class", "child-group-labels");
    }

    const root = d3.hierarchy<RawNodeDatum>(familyTree.value) as CollapsibleNode;

    root.descendants().forEach((d: CollapsibleNode) => {
        if (d.children) {
            d._children = d.children;
            const id: number = ((d.data.attributes?.id || -1) as number);

            if (id >= 0 && !!currentlyCollapsed.value[id]) {
                if (!parentNodesOfPersonFound.value.includes(id)) {
                    d.children = undefined;
                } else {
                    d.children.forEach((child: CollapsibleNode) => {
                        if (
                            !parentNodesOfPersonFound.value.includes((child.data.attributes?.id || -1) as number)
                            && child.children) {
                            child._children = child.children;
                            child.children = undefined;
                        }
                    });
                }
            }
        }
    });

    const treeLayout = d3.tree<RawNodeDatum>()
        .nodeSize([dy, dx])
        .separation((a, b) => {
            const aHasSpouse = !!(a.data.attributes?.spouseId);
            const bHasSpouse = !!(b.data.attributes?.spouseId);
            const base = a.parent === b.parent ? 1 : 1.5;
            return base + (aHasSpouse ? 0.6 : 0);
        });

    const toggleChildren = (d: CollapsibleNode) => {
        const id: number = ((d.data.attributes?.id || -1) as number);
        let shouldCollapse = false;

        if (d.children) {
            shouldCollapse = true;
            d._children = d.children;
            d.children = undefined;
        } else {
            d.children = d._children;
            d._children = undefined;
        }

        if (d.data.attributes && id >= 0) {
            currentlyCollapsed.value[id] = shouldCollapse;
        }

        update(d);
    };

    const nodePositions = new Map();

    // Track which person IDs are in the hierarchy to avoid spouse duplication
    const hierarchyPersonIds = new Set<number>();
    root.descendants().forEach(d => {
        const id = d.data.attributes?.id as number;
        if (id) hierarchyPersonIds.add(id);
    });

    const update = (source: CollapsibleNode) => {
        const nodes = root.descendants();
        const links = root.links();

        treeLayout(root);

        root.each((d: any) => {
            d.y = d.depth * (dx * 3);
        });

        // Compute spouse positions
        const spousePositions = new Map<number, { x: number; y: number; person: PersonType; familyId: number }>();
        const ndm = nodeDataMap.value;

        nodes.forEach(d => {
            const spouseId = d.data.attributes?.spouseId as number;
            if (spouseId && ndm.has(d.data.attributes?.id as number)) {
                const treeNode = ndm.get(d.data.attributes?.id as number)!;
                if (treeNode.spouse) {
                    spousePositions.set(d.data.attributes?.id as number, {
                        x: orZero(d.x) + SPOUSE_OFFSET_X,
                        y: orZero(d.y),
                        person: treeNode.spouse,
                        familyId: treeNode.familyId,
                    });
                }
            }
        });

        // Calculate bounds including spouse positions
        let x0 = Infinity;
        let x1 = -Infinity;
        let y0 = Infinity;
        let y1 = -Infinity;

        root.each(d => {
            const hasSpouse = spousePositions.has(d.data.attributes?.id as number);
            x0 = Math.min(x0, orZero(d.x) - 210);
            x1 = Math.max(x1, orZero(d.x) + (hasSpouse ? SPOUSE_OFFSET_X + NODE_W / 2 + 100 : 210));
            y0 = Math.min(y0, orZero(d.y) - 210);
            y1 = Math.max(y1, orZero(d.y) + 210);
        });

        const treeWidth = x1 - x0;
        const treeHeight = y1 - y0;

        svg
            .attr("viewBox", `${x0} ${y0} ${treeWidth} ${treeHeight}`)
            .attr("width", treeWidth)
            .attr("height", treeHeight);

        const g = svg.select("g");

        const linksGroup = g.select("g.links");
        const marriageLinksGroup = g.select("g.marriage-links");
        const spouseLinksGroup = g.select("g.spouse-links");
        const nodesGroup = g.select("g.nodes");
        const spousesGroup = g.select("g.spouses");
        const exSpousesGroup = g.select("g.ex-spouses");
        const childGroupLabelsGroup = g.select("g.child-group-labels");

        // Custom stepped line generator — routes from couple midpoint when spouse exists
        const stepPath = (d: d3.HierarchyLink<RawNodeDatum>) => {
            const sourceX = orZero(d.source.x);
            const sourceY = orZero(d.source.y);
            const target = { x: orZero(d.target.x), y: orZero(d.target.y) };

            // If source has a spouse, route from couple midpoint
            const sourceId = d.source.data.attributes?.id as number;
            let startX = sourceX;
            if (spousePositions.has(sourceId)) {
                const sp = spousePositions.get(sourceId)!;
                startX = (sourceX + sp.x) / 2;
            }

            const midY = (sourceY + target.y) / 2;

            return `M${startX},${sourceY + NODE_H / 2}
                    V${midY}
                    H${target.x}
                    V${target.y - NODE_H / 2}`;
        };

        // Update the links
        const link = linksGroup.selectAll<SVGPathElement, d3.HierarchyLink<RawNodeDatum>>("path.link")
            .data(links, (d: any) => d.target.data.attributes?.id);

        const tc = treeCustomization.value;

        const linkEnter = link.enter()
            .append("path")
            .attr("class", "link")
            .attr("fill", "none")
            .attr("stroke", tc.connectorColor)
            .attr("stroke-width", tc.connectorWidth)
            .attr("d", stepPath);

        link.merge(linkEnter as any)
            .transition()
            .duration(300)
            .attr("d", stepPath)
            .attr("stroke", tc.connectorColor)
            .attr("stroke-width", tc.connectorWidth);

        link.exit()
            .transition()
            .duration(300)
            .attr("opacity", 0)
            .remove();

        // Update the nodes
        const node = nodesGroup
            .selectAll<SVGGElement, CollapsibleNode>("g.node")
            .data(nodes, (d: any) => d.data.attributes?.id);

        nodes.forEach(d => {
            nodePositions.set(d.data.attributes?.id, { x: d.x, y: d.y });
        });

        const nodeEnter = node.enter()
            .append("g")
            .attr("class", "node")
            .attr("transform", d => {
                const parentPos = nodePositions.get(d.parent?.data.attributes?.id);
                return `translate(${parentPos?.x || d.x},${parentPos?.y || d.y})`;
            });

        const nodeGroup = nodeEnter.append("g")
            .attr("cursor", "pointer")
            .attr("margin-bottom", "12px")
            .on("click", (event, d: CollapsibleNode) => {
                event.stopPropagation();
                if (event.shiftKey) {
                    toggleChildren(d);
                } else {
                    if (isNative) {
                        Haptics.impact({ style: ImpactStyle.Light });
                    }
                    setSelectedPersonInTree(d.data.attributes as any);
                }
            });

        const createPulsingAnimation = (rect: d3.Selection<any, any, any, any>, d: CollapsibleNode) => {
            const nodeX = orZero(d.x);
            const nodeY = orZero(d.y);

            const transform = d3.select(svgRef.value).select("g").attr("transform");
            const match = /translate\(([^,]+),([^)]+)\)/.exec(transform || '');
            const translateX = match ? parseFloat(match[1]) : 0;
            const translateY = match ? parseFloat(match[2]) : 0;

            const absoluteX = nodeX + translateX;
            const absoluteY = nodeY + translateY;

            emit('centerNode', { x: absoluteX, y: absoluteY });

            const pulse = treeCustomization.value.pulseColor;
            const base = treeCustomization.value.nodeColor;

            rect.transition()
                .duration(420).ease(d3.easeSinInOut).attr("fill", pulse)
                .transition().duration(420).ease(d3.easeSinInOut).attr("fill", base)
                .transition().duration(420).ease(d3.easeSinInOut).attr("fill", pulse)
                .transition().duration(420).ease(d3.easeSinInOut).attr("fill", base)
                .transition().duration(420).ease(d3.easeSinInOut).attr("fill", pulse)
                .transition().duration(420).ease(d3.easeSinInOut).attr("fill", base);
        };

        const rootLastName = root.data.attributes?.lastName as string || '';

        const getNodeFill = (d: d3.HierarchyNode<RawNodeDatum>) => {
            if (tc.useAltColorForDiffLastName && d.data.attributes?.lastName !== rootLastName) {
                return tc.altNodeColor;
            }
            return tc.nodeColor;
        };

        const getPersonNodeFill = (person: PersonType) => {
            if (tc.useAltColorForDiffLastName && person.lastName !== rootLastName) {
                return tc.altNodeColor;
            }
            return tc.nodeColor;
        };

        // Shadow filter
        let defs = svg.select<SVGDefsElement>("defs");
        if (tc.hoverShadow !== 'off') {
            if (defs.empty()) {
                defs = svg.append("defs");
            }
            if (defs.select("#node-shadow").empty()) {
                const filter = defs.append("filter").attr("id", "node-shadow").attr("x", "-20%").attr("y", "-20%").attr("width", "140%").attr("height", "140%");
                filter.append("feDropShadow").attr("dx", 0).attr("dy", 2).attr("stdDeviation", 4).attr("flood-color", "rgba(0,0,0,0.35)");
            }
        } else if (!defs.empty()) {
            defs.select("#node-shadow").remove();
        }

        const shadowAttr = tc.hoverShadow === 'always' ? 'url(#node-shadow)' : 'none';

        // Helper: check if a node is a gender group node
        const isGenderGroup = (d: d3.HierarchyNode<RawNodeDatum>) => !!d.data.attributes?.isGenderGroup;

        // Separate gender group nodes from regular person nodes
        const regularNodeGroup = nodeGroup.filter(d => !isGenderGroup(d));
        const groupNodeGroup = nodeGroup.filter(d => isGenderGroup(d));

        // === REGULAR PERSON NODES ===
        // Add rectangle background
        regularNodeGroup.append("rect")
            .attr("x", -NODE_W / 2)
            .attr("y", -51)
            .attr("width", NODE_W)
            .attr("height", NODE_H)
            .attr("fill", d => getNodeFill(d))
            .attr("stroke", tc.nodeStrokeColor)
            .attr("rx", 5)
            .attr("ry", 5)
            .attr("filter", shadowAttr)
            .each(function(d) {
                const rect = d3.select(this);
                if (gotToPersonInTree.value?.id === (d.data.attributes?.id || -1 as number)) {
                    createPulsingAnimation(rect, d);
                }
            });

        if (tc.hoverShadow === 'hover') {
            if (isNative) {
                regularNodeGroup.select("rect").attr("filter", "url(#node-shadow)");
            } else {
                regularNodeGroup.on("mouseenter", function() {
                    d3.select(this).select("rect").attr("filter", "url(#node-shadow)");
                }).on("mouseleave", function() {
                    d3.select(this).select("rect").attr("filter", "none");
                });
            }
        }

        // Update existing rectangles (regular nodes only)
        node.filter(d => !isGenderGroup(d)).select("g rect")
            .attr("fill", d => getNodeFill(d))
            .attr("stroke", tc.nodeStrokeColor)
            .attr("filter", shadowAttr)
            .each(function(d) {
                const rect = d3.select(this);
                if (gotToPersonInTree.value?.id === (d.data.attributes?.id || -1 as number)) {
                    createPulsingAnimation(rect, d);
                }
            });

        // Add avatar circle background
        regularNodeGroup.append("circle")
            .attr("cx", 0)
            .attr("cy", -40)
            .attr("r", 30)
            .attr("fill", d => {
                if (tc.avatarBgTransparentWhenImage && d.data.attributes?.pictures) {
                    return 'transparent';
                }
                return tc.avatarBgColor;
            });

        // === GENDER GROUP NODES ===
        const genderGroupColors: Record<string, string> = { 'M': '#3b82f6', 'F': '#ec4899', 'U': '#8b5cf6' };
        const genderGroupIcons: Record<string, string> = { 'M': '♂', 'F': '♀', 'U': '◆' };

        groupNodeGroup.append("rect")
            .attr("x", -NODE_W / 2)
            .attr("y", -30)
            .attr("width", NODE_W)
            .attr("height", 60)
            .attr("fill", d => {
                const g = d.data.attributes?.groupGender as string || 'U';
                return genderGroupColors[g] || genderGroupColors['U'];
            })
            .attr("opacity", 0.15)
            .attr("stroke", d => {
                const g = d.data.attributes?.groupGender as string || 'U';
                return genderGroupColors[g] || genderGroupColors['U'];
            })
            .attr("stroke-width", 2)
            .attr("rx", 12)
            .attr("ry", 12);

        // Gender icon
        groupNodeGroup.append("text")
            .attr("y", -6)
            .attr("text-anchor", "middle")
            .attr("font-size", "20px")
            .attr("fill", d => {
                const g = d.data.attributes?.groupGender as string || 'U';
                return genderGroupColors[g] || genderGroupColors['U'];
            })
            .text(d => {
                const g = d.data.attributes?.groupGender as string || 'U';
                return genderGroupIcons[g] || '◆';
            });

        // Group label
        groupNodeGroup.append("text")
            .attr("y", 16)
            .attr("text-anchor", "middle")
            .attr("font-size", "11px")
            .attr("font-weight", "600")
            .attr("fill", tc.nodeTextColor)
            .text(d => `${d.data.attributes?.firstName} ${d.data.attributes?.lastName}`);

        // "Click to expand" hint
        groupNodeGroup.append("text")
            .attr("y", 28)
            .attr("text-anchor", "middle")
            .attr("font-size", "8px")
            .attr("fill", tc.nodeTextColor)
            .attr("opacity", 0.6)
            .text("shift+click to expand");

        // Add avatar image (regular nodes only)
        regularNodeGroup.append("image")
            .attr("x", -42)
            .attr("y", -82)
            .attr("width", 84)
            .attr("height", 84)
            .attr("clip-path", "circle(30px at center)")
            .attr("xlink:href", d => {
                const img = new Image();
                let url = '';

                if (!!d.data.attributes?.pictures && !!currentFamilyTree.value) {
                    const firstPic = (d.data.attributes.pictures as string).split(ARRAY_TO_STRING_JOINER)[0];
                    if (/^\d+$/.test(firstPic)) {
                        url = getPersonPictureUrl(firstPic, 'thumb');
                    } else {
                        url = getLegacyPersonPictureUrl(currentFamilyTree.value.familyId, d.data.attributes.id as number, firstPic);
                    }
                } else {
                    const initials = getInitialsFromNode(d);
                    url = createInitialsSvg(initials)
                }

                img.src = url;
                return url;
            });

        // Add name text (regular nodes only)
        regularNodeGroup.append("text")
            .attr("dy", 12)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("font-weight", "200")
            .attr("stroke", tc.nodeTextColor)
            .attr("fill", tc.nodeTextColor)
            .attr("stroke-width", 0)
            .text(d => {
                const attrs = d.data.attributes;
                return [
                    attrs?.firstName,
                    attrs?.middleName,
                    attrs?.lastName
                ].filter(Boolean).join(' ');
            });

        // Add birth date (regular nodes only)
        regularNodeGroup.append("text")
            .attr("dy", 27)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("font-weight", "200")
            .attr("stroke", tc.nodeTextColor)
            .attr("fill", tc.nodeTextColor)
            .attr("stroke-width", 0)
            .text(d => d.data.attributes?.birthDate || '');

        // Update existing node colors
        node.selectAll("circle").attr("fill", (d: any) => {
            if (tc.avatarBgTransparentWhenImage && d.data?.attributes?.pictures) {
                return 'transparent';
            }
            return tc.avatarBgColor;
        });
        node.selectAll("text")
            .attr("stroke", tc.nodeTextColor)
            .attr("fill", tc.nodeTextColor);

        // Update existing nodes
        node.merge(nodeEnter as any)
            .transition()
            .duration(300)
            .attr("transform", d => `translate(${d.x},${d.y})`);

        // Remove old nodes
        node.exit<CollapsibleNode>()
            .transition()
            .duration(300)
            .attr("transform", d => {
                const parentPos = nodePositions.get(d.parent?.data.attributes?.id);
                return `translate(${parentPos?.x || d.x},${parentPos?.y || d.y})`;
            })
            .attr("opacity", 0)
            .remove();

        // ===== SPOUSE RENDERING =====
        marriageLinksGroup.selectAll("*").remove();
        spousesGroup.selectAll("*").remove();
        exSpousesGroup.selectAll("*").remove();
        childGroupLabelsGroup.selectAll("*").remove();

        // Render current spouses
        spousePositions.forEach((sp, memberId) => {
            const person = sp.person;
            const memberNode = nodes.find(n => (n.data.attributes?.id as number) === memberId);
            if (!memberNode) return;

            const memberX = orZero(memberNode.x);
            const memberY = orZero(memberNode.y);
            const spX = sp.x;
            const spY = sp.y;

            // Marriage connector line
            marriageLinksGroup.append("line")
                .attr("x1", memberX + NODE_W / 2)
                .attr("y1", memberY)
                .attr("x2", spX - NODE_W / 2)
                .attr("y2", spY)
                .attr("stroke", tc.connectorColor)
                .attr("stroke-width", tc.connectorWidth);

            // Heart symbol at midpoint
            const midX = (memberX + NODE_W / 2 + spX - NODE_W / 2) / 2;
            marriageLinksGroup.append("text")
                .attr("x", midX)
                .attr("y", memberY)
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "central")
                .attr("font-size", "10px")
                .attr("fill", "#ef4444")
                .text("♥");

            // Check if spouse is already in the hierarchy (dedup)
            const isInHierarchy = hierarchyPersonIds.has(person.id);

            // Spouse node group
            const spouseG = spousesGroup.append("g")
                .attr("class", "spouse-node")
                .attr("transform", `translate(${spX},${spY})`)
                .attr("cursor", "pointer")
                .attr("opacity", isInHierarchy ? 0.5 : 1)
                .on("click", (event: MouseEvent) => {
                    event.stopPropagation();
                    if (isNative) {
                        Haptics.impact({ style: ImpactStyle.Light });
                    }
                    setSelectedPersonInTree(person as any);
                });

            // Spouse rect
            spouseG.append("rect")
                .attr("x", -NODE_W / 2)
                .attr("y", -51)
                .attr("width", NODE_W)
                .attr("height", NODE_H)
                .attr("fill", getPersonNodeFill(person))
                .attr("stroke", tc.nodeStrokeColor)
                .attr("rx", 5)
                .attr("ry", 5)
                .attr("filter", shadowAttr);

            // Spouse avatar circle
            spouseG.append("circle")
                .attr("cx", 0)
                .attr("cy", -40)
                .attr("r", 30)
                .attr("fill", (tc.avatarBgTransparentWhenImage && person.pictures?.length) ? 'transparent' : tc.avatarBgColor);

            // Spouse avatar image
            const imgUrl = getPersonImageUrl(person);
            spouseG.append("image")
                .attr("x", -42)
                .attr("y", -82)
                .attr("width", 84)
                .attr("height", 84)
                .attr("clip-path", "circle(30px at center)")
                .attr("xlink:href", imgUrl);

            // Spouse name
            const spouseName = [person.firstName, person.middleName, person.lastName].filter(Boolean).join(' ');
            spouseG.append("text")
                .attr("dy", 12)
                .attr("text-anchor", "middle")
                .attr("font-size", "12px")
                .attr("font-weight", "200")
                .attr("stroke", tc.nodeTextColor)
                .attr("fill", tc.nodeTextColor)
                .attr("stroke-width", 0)
                .text(spouseName);

            // Spouse birth date
            spouseG.append("text")
                .attr("dy", 27)
                .attr("text-anchor", "middle")
                .attr("font-size", "12px")
                .attr("font-weight", "200")
                .attr("stroke", tc.nodeTextColor)
                .attr("fill", tc.nodeTextColor)
                .attr("stroke-width", 0)
                .text(person.birthDate || '');

            // Cross-family link icon (if spouse belongs to a different family)
            const treeNode = ndm.get(memberId);
            if (treeNode && sp.familyId) {
                // Check if spouse has their own family tree (different from current)
                const currentFamId = currentFamilyTree.value?.familyId;
                if (currentFamId && sp.familyId !== currentFamId) {
                    const linkIcon = spouseG.append("g")
                        .attr("transform", `translate(${NODE_W / 2 - 14}, ${-NODE_H / 2 + 8})`)
                        .attr("cursor", "pointer")
                        .on("click", (event: MouseEvent) => {
                            event.stopPropagation();
                            router.push({
                                name: 'member-personId-tree-familyId',
                                params: { personId: person.id, familyId: sp.familyId }
                            });
                        });

                    linkIcon.append("circle")
                        .attr("r", 8)
                        .attr("fill", "rgba(59,130,246,0.9)");

                    linkIcon.append("text")
                        .attr("text-anchor", "middle")
                        .attr("dominant-baseline", "central")
                        .attr("font-size", "9px")
                        .attr("fill", "white")
                        .text("↗");

                    linkIcon.append("title")
                        .text("View in their family tree");
                }
            }

            // "Also in tree" indicator for deduped spouses
            if (isInHierarchy) {
                spouseG.append("text")
                    .attr("y", NODE_H / 2 + 12)
                    .attr("text-anchor", "middle")
                    .attr("font-size", "8px")
                    .attr("fill", tc.nodeTextColor)
                    .attr("opacity", 0.7)
                    .text("(also in tree)");
            }
        });

        // ===== EX-SPOUSE RENDERING =====
        if (tc.exSpouseDisplay !== 'hidden') {
            nodes.forEach(d => {
                const memberId = d.data.attributes?.id as number;
                const exIds = d.data.attributes?.exSpouseIds as string;
                if (!exIds || !memberId) return;

                const treeNode = ndm.get(memberId);
                if (!treeNode || treeNode.marriages.length === 0) return;

                const memberX = orZero(d.x);
                const memberY = orZero(d.y);
                const isExpanded = expandedExSpouses.value.has(memberId);
                const showFull = tc.exSpouseDisplay === 'always' || isExpanded;

                if (!showFull) {
                    // Render indicator badge
                    const badgeG = exSpousesGroup.append("g")
                        .attr("transform", `translate(${memberX - NODE_W / 2 - 16}, ${memberY})`)
                        .attr("cursor", "pointer")
                        .on("click", (event: MouseEvent) => {
                            event.stopPropagation();
                            const newSet = new Set(expandedExSpouses.value);
                            newSet.add(memberId);
                            expandedExSpouses.value = newSet;
                            renderTree();
                        });

                    const count = treeNode.marriages.length;
                    const label = `+${count}`;
                    const badgeW = label.length * 7 + 10;

                    badgeG.append("rect")
                        .attr("x", -badgeW / 2)
                        .attr("y", -10)
                        .attr("width", badgeW)
                        .attr("height", 20)
                        .attr("rx", 10)
                        .attr("ry", 10)
                        .attr("fill", "rgba(245,158,11,0.85)");

                    badgeG.append("text")
                        .attr("text-anchor", "middle")
                        .attr("dominant-baseline", "central")
                        .attr("font-size", "9px")
                        .attr("font-weight", "600")
                        .attr("fill", "white")
                        .text(label);

                    badgeG.append("title")
                        .text(`${count} ex-partner${count > 1 ? 's' : ''} — click to show`);
                } else {
                    // Render full ex-spouse nodes
                    treeNode.marriages.forEach((exPerson, i) => {
                        const exX = memberX - SPOUSE_OFFSET_X - (i * (SPOUSE_OFFSET_X));
                        const exY = memberY;

                        // Dashed connector
                        exSpousesGroup.append("line")
                            .attr("x1", i === 0 ? memberX - NODE_W / 2 : exX + SPOUSE_OFFSET_X - NODE_W / 2)
                            .attr("y1", exY)
                            .attr("x2", exX + NODE_W / 2)
                            .attr("y2", exY)
                            .attr("stroke", tc.connectorColor)
                            .attr("stroke-width", tc.connectorWidth)
                            .attr("stroke-dasharray", "6,4")
                            .attr("opacity", 0.5);

                        const exG = exSpousesGroup.append("g")
                            .attr("class", "ex-spouse-node")
                            .attr("transform", `translate(${exX},${exY})`)
                            .attr("cursor", "pointer")
                            .attr("opacity", 0.6)
                            .on("click", (event: MouseEvent) => {
                                event.stopPropagation();
                                if (isNative) {
                                    Haptics.impact({ style: ImpactStyle.Light });
                                }
                                setSelectedPersonInTree(exPerson as any);
                            });

                        // Ex-spouse rect with dashed border
                        exG.append("rect")
                            .attr("x", -NODE_W / 2)
                            .attr("y", -51)
                            .attr("width", NODE_W)
                            .attr("height", NODE_H)
                            .attr("fill", tc.altNodeColor)
                            .attr("stroke", tc.nodeStrokeColor)
                            .attr("stroke-dasharray", "4,3")
                            .attr("rx", 5)
                            .attr("ry", 5);

                        // Ex-spouse avatar
                        exG.append("circle")
                            .attr("cx", 0)
                            .attr("cy", -40)
                            .attr("r", 30)
                            .attr("fill", tc.avatarBgColor)
                            .attr("opacity", 0.8);

                        const exImgUrl = getPersonImageUrl(exPerson);
                        exG.append("image")
                            .attr("x", -42)
                            .attr("y", -82)
                            .attr("width", 84)
                            .attr("height", 84)
                            .attr("clip-path", "circle(30px at center)")
                            .attr("xlink:href", exImgUrl);

                        // Ex-spouse name
                        const exName = [exPerson.firstName, exPerson.middleName, exPerson.lastName].filter(Boolean).join(' ');
                        exG.append("text")
                            .attr("dy", 12)
                            .attr("text-anchor", "middle")
                            .attr("font-size", "12px")
                            .attr("font-weight", "200")
                            .attr("stroke", tc.nodeTextColor)
                            .attr("fill", tc.nodeTextColor)
                            .attr("stroke-width", 0)
                            .text(exName);

                        // "Ex" label
                        exG.append("text")
                            .attr("dy", 27)
                            .attr("text-anchor", "middle")
                            .attr("font-size", "10px")
                            .attr("fill", "#f59e0b")
                            .attr("opacity", 0.9)
                            .text("Ex-partner");
                    });

                    // Collapse button
                    if (tc.exSpouseDisplay === 'indicator') {
                        const collapseG = exSpousesGroup.append("g")
                            .attr("transform", `translate(${memberX - NODE_W / 2 - 16}, ${memberY - NODE_H / 2 + 8})`)
                            .attr("cursor", "pointer")
                            .on("click", (event: MouseEvent) => {
                                event.stopPropagation();
                                const newSet = new Set(expandedExSpouses.value);
                                newSet.delete(memberId);
                                expandedExSpouses.value = newSet;
                                renderTree();
                            });

                        collapseG.append("circle")
                            .attr("r", 8)
                            .attr("fill", "rgba(0,0,0,0.6)");

                        collapseG.append("text")
                            .attr("text-anchor", "middle")
                            .attr("dominant-baseline", "central")
                            .attr("font-size", "10px")
                            .attr("fill", "white")
                            .text("×");
                    }
                }
            });
        }

        // ===== HALF-SIBLING GROUP LABELS =====
        nodes.forEach(d => {
            const memberId = d.data.attributes?.id as number;
            if (!d.children || d.children.length < 2) return;

            // Group children by their "other parent"
            const groups = new Map<number | string, d3.HierarchyNode<RawNodeDatum>[]>();
            d.children.forEach(child => {
                const childMotherId = child.data.attributes?.motherId as number | '';
                const childFatherId = child.data.attributes?.fatherId as number | '';
                // The "other parent" is whichever parent is NOT the current hierarchy node
                let otherParentId: number | string = 'unknown';
                if (childMotherId && childMotherId !== memberId) {
                    otherParentId = childMotherId;
                } else if (childFatherId && childFatherId !== memberId) {
                    otherParentId = childFatherId;
                }
                if (!groups.has(otherParentId)) {
                    groups.set(otherParentId, []);
                }
                groups.get(otherParentId)!.push(child);
            });

            // Only show labels if there are 2+ distinct partner groups
            if (groups.size < 2) return;

            groups.forEach((children, otherParentId) => {
                if (children.length === 0) return;

                // Calculate horizontal center of this group
                const minX = Math.min(...children.map(c => orZero(c.x)));
                const maxX = Math.max(...children.map(c => orZero(c.x)));
                const centerX = (minX + maxX) / 2;
                const labelY = orZero(children[0].y) - NODE_H / 2 - 14;

                // Look up partner name
                let partnerName = 'Unknown';
                if (typeof otherParentId === 'number') {
                    const partnerNode = ndm.get(otherParentId);
                    if (partnerNode) {
                        partnerName = `${partnerNode.member.firstName} ${partnerNode.member.lastName}`;
                    }
                }

                const labelText = `with ${partnerName}`;
                const textW = labelText.length * 5 + 12;

                const labelG = childGroupLabelsGroup.append("g")
                    .attr("transform", `translate(${centerX},${labelY})`);

                labelG.append("rect")
                    .attr("x", -textW / 2)
                    .attr("y", -8)
                    .attr("width", textW)
                    .attr("height", 16)
                    .attr("rx", 8)
                    .attr("ry", 8)
                    .attr("fill", "rgba(0,0,0,0.5)");

                labelG.append("text")
                    .attr("text-anchor", "middle")
                    .attr("dominant-baseline", "central")
                    .attr("font-size", "8px")
                    .attr("font-weight", "500")
                    .attr("fill", "white")
                    .attr("opacity", 0.9)
                    .text(labelText);
            });
        });

        clearGoToPersonInTree();
        parentNodesOfPersonFound.value = [];

        // Render quick-add buttons after tree update settles
        setTimeout(() => renderQuickAddButtons(), 350);
    }

    update(root);
};

const renderQuickAddButtons = () => {
    if (!svgRef.value || !user.value) return;

    const svg = d3.select(svgRef.value);
    const g = svg.select("g");

    g.selectAll(".quick-add-group").remove();

    const selected = selectedPersonInTree.value;
    if (!selected) return;

    const nodesGroup = g.select("g.nodes");
    let targetNode: d3.HierarchyNode<RawNodeDatum> | null = null;
    let targetElement: SVGGElement | null = null;

    nodesGroup.selectAll<SVGGElement, d3.HierarchyNode<RawNodeDatum>>("g.node")
        .each(function(d) {
            if (d.data.attributes?.id === selected.id) {
                targetNode = d;
                targetElement = this;
            }
        });

    if (!targetNode || !targetElement) return;

    const attrs = (targetNode as d3.HierarchyNode<RawNodeDatum>).data.attributes || {};
    const hasChildren = !!((targetNode as any).children?.length || (targetNode as any)._children?.length);
    const adult = isPersonAdult(attrs, hasChildren);
    const showParent = canAddParent(attrs);
    const hasCurrentSpouse = !!(attrs.spouseId);

    type BtnConfig = { type: 'parent' | 'child' | 'sibling' | 'spouse'; cx: number; cy: number; label: string };
    const buttons: BtnConfig[] = [];

    if (showParent) {
        buttons.push({ type: 'parent', cx: 0, cy: -75, label: 'Add Parent' });
    }
    if (adult) {
        buttons.push({ type: 'child', cx: 0, cy: 72, label: 'Add Child' });
    }
    buttons.push({ type: 'sibling', cx: -85, cy: 0, label: 'Add Sibling' });
    if (adult && !hasCurrentSpouse) {
        // Only show "Add Spouse" if person doesn't already have a current spouse
        buttons.push({ type: 'spouse', cx: 85, cy: 0, label: 'Add Spouse' });
    } else if (adult && hasCurrentSpouse) {
        // Shift further right past the spouse node
        buttons.push({ type: 'spouse', cx: SPOUSE_OFFSET_X + 85, cy: 0, label: 'Add Partner' });
    }

    const nodeX = (targetNode as any).x || 0;
    const nodeY = (targetNode as any).y || 0;

    const quickAddGroup = g.append("g")
        .attr("class", "quick-add-group")
        .attr("transform", `translate(${nodeX},${nodeY})`);

    const r = QUICK_ADD_BTN_RADIUS;

    buttons.forEach(btn => {
        const btnGroup = quickAddGroup.append("g")
            .attr("class", `quick-add-btn quick-add-btn-${btn.type}`)
            .attr("cursor", "pointer")
            .attr("transform", `translate(${btn.cx},${btn.cy})`)
            .on("click", (event: MouseEvent) => {
                event.stopPropagation();
                if (isNative) {
                    Haptics.impact({ style: ImpactStyle.Light });
                }
                triggerQuickAdd(selected, btn.type);
            });

        // Shadow circle for depth
        btnGroup.append("circle")
            .attr("r", r + 1)
            .attr("fill", "none")
            .attr("stroke", "rgba(0,0,0,0.3)")
            .attr("stroke-width", 3)
            .attr("opacity", 0)
            .transition()
            .duration(200)
            .attr("opacity", 0.6);

        // Background circle
        btnGroup.append("circle")
            .attr("r", r)
            .attr("fill", QUICK_ADD_COLORS[btn.type].bg)
            .attr("stroke", "white")
            .attr("stroke-width", 2.5)
            .attr("opacity", 0)
            .transition()
            .duration(200)
            .attr("opacity", 1);

        // Plus icon
        btnGroup.append("text")
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "central")
            .attr("font-size", "16px")
            .attr("font-weight", "bold")
            .attr("fill", "white")
            .attr("pointer-events", "none")
            .attr("opacity", 0)
            .text("+")
            .transition()
            .duration(200)
            .attr("opacity", 1);

        btnGroup.append("title")
            .text(btn.label);

        btnGroup.on("mouseenter", function() {
            d3.select(this).select("circle")
                .transition().duration(150)
                .attr("r", r + 3)
                .attr("fill", QUICK_ADD_COLORS[btn.type].hover);
        }).on("mouseleave", function() {
            d3.select(this).select("circle")
                .transition().duration(150)
                .attr("r", r)
                .attr("fill", QUICK_ADD_COLORS[btn.type].bg);
        });
    });

    // Add small labels below each button with background pill for visibility
    buttons.forEach(btn => {
        const labelY = btn.cy + (btn.cy >= 0 ? r + 14 : -(r + 6));
        const labelGroup = quickAddGroup.append("g")
            .attr("transform", `translate(${btn.cx},${labelY})`)
            .attr("pointer-events", "none")
            .attr("opacity", 0);

        const textWidth = btn.label.length * 5.5 + 10;
        labelGroup.append("rect")
            .attr("x", -textWidth / 2)
            .attr("y", -7)
            .attr("width", textWidth)
            .attr("height", 14)
            .attr("rx", 7)
            .attr("ry", 7)
            .attr("fill", "rgba(0,0,0,0.75)");

        labelGroup.append("text")
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "central")
            .attr("font-size", "9px")
            .attr("font-weight", "600")
            .attr("fill", "white")
            .text(btn.label);

        labelGroup.transition()
            .duration(300)
            .attr("opacity", 1);
    });
};

// Re-render quick-add buttons when selection changes
watch(selectedPersonInTree, () => {
    renderQuickAddButtons();
});

const setupFamilyTree = () => {
    if (!currentFamilyTree.value) return;

    // Build the lookup map
    const map = new Map<number, FamilyTreeNodeType>();
    buildNodeDataMap(currentFamilyTree.value, map);
    nodeDataMap.value = map;

    familyTree.value = {
        name: getNodeName(currentFamilyTree.value.member),
        attributes: getAttributes(currentFamilyTree.value),
        children: getChildren(currentFamilyTree.value)
    };

    if (!hasSetFamilyTree.value) {
        renderTree();
        hasSetFamilyTree.value = true;
    }
};

watch(() => gotToPersonInTree.value, (newPerson) => {
    if (!newPerson || !familyTree.value) return;

    const findNodeAndExpandPath = (root: CollapsibleNode, targetId: number): CollapsibleNode | null => {
        if (root.data.attributes?.id === targetId) {
            parentNodesOfPersonFound.value.push((root.data.attributes?.id || -1) as number);
            return root;
        }

        if (root._children) {
            root.children = root._children;
            root._children = undefined;
        }

        if (root.children) {
            for (const child of root.children) {
                const found = findNodeAndExpandPath(child as CollapsibleNode, targetId);
                if (found) {
                    parentNodesOfPersonFound.value.push((root.data.attributes?.id || -1) as number);
                    return found;
                }
            }
        }

        if (root.children
            && !root.children.some(child => findNodeAndExpandPath(child as CollapsibleNode, targetId))
        ) {
            root._children = root.children;
            root.children = undefined;
        }

        return null;
    };

    const root = d3.hierarchy(familyTree.value) as CollapsibleNode;
    const targetNode = findNodeAndExpandPath(root, newPerson.id);

    if (targetNode) {
        renderTree();
    }
})

onMounted(() => {
    setupFamilyTree();
});

watch(currentFamilyTree, (newVal, oldVal) => {
    if (!newVal) return;
    if (!oldVal || newVal.familyId !== oldVal.familyId) {
        hasSetFamilyTree.value = false;
        setupFamilyTree();
    } else {
        // Same family but data changed - rebuild map and re-render
        const map = new Map<number, FamilyTreeNodeType>();
        buildNodeDataMap(newVal, map);
        nodeDataMap.value = map;

        familyTree.value = {
            name: getNodeName(newVal.member),
            attributes: getAttributes(newVal),
            children: getChildren(newVal)
        };
        renderTree();
    }
}, { deep: true })

// Re-render tree when customization settings change
watch(treeCustomization, () => {
    if (hasSetFamilyTree.value && currentFamilyTree.value) {
        // Rebuild tree data so structural changes (e.g. groupChildrenByGender) take effect
        familyTree.value = {
            name: getNodeName(currentFamilyTree.value.member),
            attributes: getAttributes(currentFamilyTree.value),
            children: getChildren(currentFamilyTree.value)
        };
        renderTree();
    }
}, { deep: true })
</script>

<template>
    <div ref="containerRef"
        class="relative flex flex-col items-center transition-all duration-300">
        <svg ref="svgRef" :width="width" :height="height" preserveAspectRatio="xMidYMid meet"></svg>
    </div>
</template>

<style scoped>
svg {
    width: 100%;
    min-width: 100%;
    height: 100%;
    min-height: 100%;
    display: block;
}

.node {
    cursor: pointer;
}

.node, .link {
    transition: all 0.3s ease-in-out;
}
</style>
