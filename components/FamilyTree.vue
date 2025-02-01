<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { type FamilyTreeNodeType } from '@/types/family';
import * as d3 from 'd3';
import { usePersonStore } from '@/stores/person';
import { useDraggableZoneStore } from '@/stores/draggableZone';
import type { PersonType } from '@/types/person';

const personStore = usePersonStore();
const { setSelectedPersonInTree, clearGoToPersonInTree } = personStore;
const { gotToPersonInTree } = storeToRefs(personStore);

const draggableStore = useDraggableZoneStore();
const { getSecondaryColorByCurrentColor } = storeToRefs(draggableStore);

const { treeNode } = defineProps({
    treeNode: {
        type: {} as PropType<FamilyTreeNodeType | null | undefined>,
        required: true,
    },
});

const emit = defineEmits<{
    (e: 'centerNode', position: { x: number, y: number }): void
}>();

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
const dx = 60; // vertical spacing
const dy = 180; // horizontal spacing

const currentlyCollapsed = ref<{[key: number]: boolean}>({});
const parentNodesOfPersonFound = ref<number[]>([]);

const familyTree = ref<RawNodeDatum | null>(null);

const orZero = (num: number | undefined) => {
    return num ? num : 0;
}

const getNodeName = (person: PersonType) => {
    return `${person.first_name} ${person.last_name}`;
}

const getAttributes = (person: PersonType) => ({
    id: person.id,
    first_name: person.first_name,
    last_name: person.last_name,
    middle_name: person.middle_name ? person.middle_name : '',
    birth_date: person.birth_date ? person.birth_date : '',
    death_date: person.death_date ? person.death_date : '',
    is_living: person.is_living,
    gender: person.gender,
    mother_id: person.mother_id ? person.mother_id : '',
    father_id: person.father_id ? person.father_id : '',
    pictures: person.pictures.join(',')
})

const getChildren = (treeNode: FamilyTreeNodeType): RawNodeDatum[] => {
    if (treeNode.children.length === 0) return [];

    return treeNode.children.map((child) => ({
        name: getNodeName(child.member),
        attributes: getAttributes(child.member),
        children: getChildren(child)
    }));
}

const getInitials = (d: d3.HierarchyNode<RawNodeDatum>) => {
    const firstName = d.data.attributes?.first_name as string || '';
    const lastName = d.data.attributes?.last_name as string || '';
    const firstInitial = firstName.charAt(0);
    const lastInitial = lastName.charAt(0);
    return `${firstInitial}${lastInitial}`.toUpperCase();
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

const renderTree = () => {
    if (!familyTree.value || !svgRef.value || !containerRef.value) return;

    // Update width and height based on container size
    // width.value = containerRef.value.offsetWidth;
    // height.value = containerRef.value.offsetHeight;

    // Initial SVG setup if not already done
    let svg = d3.select(svgRef.value);
    if (svg.select("g").empty()) {
        svg.selectAll("*").remove();
        const g = svg.append("g");

        // Create separate groups for links and nodes, ensuring links are rendered first
        g.append("g").attr("class", "links");
        g.append("g").attr("class", "nodes");
    }

    const root = d3.hierarchy<RawNodeDatum>(familyTree.value) as CollapsibleNode;
    
    // Initialize the root's children state
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
                            // gotToPersonInTree.value?.id !== (child.data.attributes?.id || -1) as number
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
        .separation((a, b) => a.parent === b.parent ? 1 : 1.5);

    // Function to toggle children
    const toggleChildren = (d: CollapsibleNode) => {
        const id: number = ((d.data.attributes?.id || -1) as number);
        let shouldCollapse = false;

        if (d.children) {
            shouldCollapse = true;
            // Collapse Children
            d._children = d.children;
            d.children = undefined;
        } else {
            // Expand Children
            d.children = d._children;
            d._children = undefined;
        }

        if (d.data.attributes && id >= 0) {
            currentlyCollapsed.value[id] = shouldCollapse;
        }

        update(d);
    };

    // Store the initial position of nodes
    const nodePositions = new Map();

    const update = (source: CollapsibleNode) => {
        // Apply the tree layout
        const nodes = root.descendants();
        const links = root.links();

        // Apply the tree layout
        treeLayout(root);

        // Adjust vertical spacing after layout
        root.each((d: any) => {
            // Multiply the y position by a factor to increase vertical spacing
            d.y = d.depth * (dx * 3); // Increase the multiplier (2) for more spacing
        });

        // Calculate the bounds of the tree to center it
        let x0 = Infinity;
        let x1 = -Infinity;
        let y0 = Infinity;
        let y1 = -Infinity;

        root.each(d => {
            x0 = Math.min(x0, orZero(d.x) - 210);
            x1 = Math.max(x1, orZero(d.x) + 210);
            y0 = Math.min(y0, orZero(d.y) - 210);
            y1 = Math.max(y1, orZero(d.y) + 210);
        });

        // Calculate total width and height needed
        const treeWidth = x1 - x0;
        const treeHeight = y1 - y0;

        svg
            .attr("viewBox", `${x0} ${y0} ${treeWidth} ${treeHeight}`)
            .attr("width", treeWidth)
            .attr("height", treeHeight);

        // Get the existing group or create a new one
        const g = svg.select("g");

        // Select the specific groups for links and nodes
        const linksGroup = g.select("g.links");
        const nodesGroup = g.select("g.nodes");

        // Custom stepped line generator
        const stepPath = (d: d3.HierarchyLink<RawNodeDatum>) => {
            const source = { x: orZero(d.source.x), y: orZero(d.source.y) };
            const target = { x: orZero(d.target.x), y: orZero(d.target.y) };
            const midY = (source.y + target.y) / 2;
            
            return `M${source.x},${source.y}
                    V${midY}
                    H${target.x}
                    V${target.y}`;
        };

        // Update the links
        const link = linksGroup.selectAll<SVGPathElement, d3.HierarchyLink<RawNodeDatum>>("path.link")
            .data(links, (d: any) => d.target.data.attributes?.id);

        // Enter new links
        const linkEnter = link.enter()
            .append("path")
            .attr("class", "link")
            .attr("fill", "none")
            .attr("stroke", "#3f3f46")
            .attr("stroke-width", 3)
            .attr("d", stepPath);

        // Update existing links
        link.merge(linkEnter as any)
            .transition()
            .duration(300)
            .attr("d", stepPath);

        // Remove old links
        link.exit()
            .transition()
            .duration(300)
            .attr("opacity", 0)
            .remove();

        // Update the nodes
        const node = nodesGroup
            .selectAll<SVGGElement, CollapsibleNode>("g.node")
            .data(nodes, (d: any) => d.data.attributes?.id);

        // Store new positions before transition
        nodes.forEach(d => {
            nodePositions.set(d.data.attributes?.id, { x: d.x, y: d.y });
        });

        // Enter new nodes at parent's previous position
        const nodeEnter = node.enter()
            .append("g")
            .attr("class", "node")
            .attr("transform", d => {
                const parentPos = nodePositions.get(d.parent?.data.attributes?.id);
                return `translate(${parentPos?.x || d.x},${parentPos?.y || d.y})`;
            });

        // Add node boxes with basic info
        const nodeGroup = nodeEnter.append("g")
            .attr("cursor", "pointer")
            .attr("margin-bottom", "12px")
            .on("click", (event, d: CollapsibleNode) => {
                event.stopPropagation();
                if (event.shiftKey) {
                    toggleChildren(d);
                } else {
                    setSelectedPersonInTree(d.data.attributes as any)
                }
            });
        
        // Function to create pulsing animation
        const createPulsingAnimation = (rect: d3.Selection<any, any, any, any>, d: CollapsibleNode) => {
            // Get the node's coordinates relative to the SVG
            const nodeX = orZero(d.x);
            const nodeY = orZero(d.y);

            // Get the current transform of the main group
            const transform = d3.select(svgRef.value).select("g").attr("transform");
            const match = /translate\(([^,]+),([^)]+)\)/.exec(transform || '');
            const translateX = match ? parseFloat(match[1]) : 0;
            const translateY = match ? parseFloat(match[2]) : 0;
            
            // Calculate absolute position considering the translation
            const absoluteX = nodeX + translateX;
            const absoluteY = nodeY + translateY;

            // Emit the position to be centered
            emit('centerNode', { x: absoluteX, y: absoluteY });

            rect.transition()
                // 1st pulse
                .duration(420)
                .ease(d3.easeSinInOut)
                .attr("fill", "#d97706")
                .transition()
                .duration(420)
                .ease(d3.easeSinInOut)
                .attr("fill", "#3f3f46")
                // 2nd pulse
                .transition()
                .duration(420)
                .ease(d3.easeSinInOut)
                .attr("fill", "#d97706")
                .transition()
                .duration(420)
                .ease(d3.easeSinInOut)
                .attr("fill", "#3f3f46")
                // 3rd pulse
                .transition()
                .duration(420)
                .ease(d3.easeSinInOut)
                .attr("fill", "#d97706")
                .transition()
                .duration(420)
                .ease(d3.easeSinInOut)
                .attr("fill", "#3f3f46");
        };
        
        // Add rectangle background
        nodeGroup.append("rect")
            .attr("x", -60)
            .attr("y", -51)
            .attr("width", 120)
            .attr("height", 99)
            .attr("fill", "#3f3f46")
            .attr("stroke", "white")
            .attr("rx", 5)
            .attr("ry", 5)
            .each(function(d) {
                const rect = d3.select(this);
                if (gotToPersonInTree.value?.id === (d.data.attributes?.id || -1 as number)) {
                    // console.log('should pulse - new node');
                    createPulsingAnimation(rect, d);
                }
            });

        // Update existing rectangles
        node.select("g rect")
            .each(function(d) {
                const rect = d3.select(this);
                if (gotToPersonInTree.value?.id === (d.data.attributes?.id || -1 as number)) {
                    // console.log('should pulse - existing node');
                    createPulsingAnimation(rect, d);
                }
            });

        // Add avatar circle background
        nodeGroup.append("circle")
            .attr("cx", 0)
            .attr("cy", -20)
            .attr("r", 15)
            .attr("fill", "#e5e7eb");

        // Add avatar image
        nodeGroup.append("image")
            .attr("x", -21)
            .attr("y", -41)
            .attr("width", 42)
            .attr("height", 42)
            .attr("clip-path", "circle(15px at center)")
            .attr("xlink:href", d => {
                const img = new Image();
                let url = '';

                if (!!d.data.attributes?.pictures) {
                    url = (d.data.attributes.pictures as string).split(',')[0]
                } else {
                    const initials = getInitials(d);
                    url = createInitialsSvg(initials)
                }

                img.src = url;
                return url;
            });

        // Add name text
        nodeGroup.append("text")
            .attr("dy", 12)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("font-weight", "200")
            .attr("stroke", "white")
            .attr("fill", "white")
            .attr("stroke-width", 0)
            .text(d => {
                const attrs = d.data.attributes;
                return [
                    attrs?.first_name,
                    attrs?.middle_name,
                    attrs?.last_name
                ].filter(Boolean).join(' ');
            });

        // Add birth date
        nodeGroup.append("text")
            .attr("dy", 27)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("font-weight", "200")
            .attr("stroke", "white")
            .attr("fill", "white")
            .attr("stroke-width", 0)
            .text(d => d.data.attributes?.birth_date || '');

        // Update existing nodes
        const nodeUpdate = node.merge(nodeEnter as any)
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

        clearGoToPersonInTree();
        parentNodesOfPersonFound.value = [];
    }
    
    update(root);
};

const setupFamilyTree = () => {
    if (!treeNode) return;

    familyTree.value = {
        name: getNodeName(treeNode.member),
        attributes: getAttributes(treeNode.member),
        children: getChildren(treeNode)
    };

    if (!hasSetFamilyTree.value) {
        renderTree();
        hasSetFamilyTree.value = true;
    }
};

watch(() => gotToPersonInTree.value, (newPerson) => {
    if (!newPerson || !familyTree.value) return;

    // Helper function to find node and expand path
    const findNodeAndExpandPath = (root: CollapsibleNode, targetId: number): CollapsibleNode | null => {
        // Check if current node is the target
        if (root.data.attributes?.id === targetId) {
            parentNodesOfPersonFound.value.push((root.data.attributes?.id || -1) as number);
            return root;
        }

        // If node has collapsed children (_children), expand them
        if (root._children) {
            root.children = root._children;
            root._children = undefined;
        }

        // Search through children if they exist
        if (root.children) {
            for (const child of root.children) {
                const found = findNodeAndExpandPath(child as CollapsibleNode, targetId);
                if (found) {
                    parentNodesOfPersonFound.value.push((root.data.attributes?.id || -1) as number);
                    return found;
                }
            }
        }

        // If not found in this branch, collapse it back unless it's in the path to target
        if (root.children 
            && !root.children.some(child => findNodeAndExpandPath(child as CollapsibleNode, targetId))
        ) {
            root._children = root.children;
            root.children = undefined;
        }

        return null;
    };

    // Get the root node and find the target person
    const root = d3.hierarchy(familyTree.value) as CollapsibleNode;
    const targetNode = findNodeAndExpandPath(root, newPerson.id);

    // console.log("\n== targetNode ==\n", targetNode, "\n");
    if (targetNode) {
        renderTree();
    }
})

onMounted(() => {
    // Initial render
    setupFamilyTree();
    
    // Re-render on window resize
    const resizeObserver = new ResizeObserver(() => {
        setupFamilyTree();
    });

    if (containerRef.value) {
        resizeObserver.observe(containerRef.value);
    }

    // Cleanup
    onUnmounted(() => {
        resizeObserver.disconnect();
    });
});
</script>

<template>
    <div
        v-if="treeNode" 
        ref="containerRef" 
        class="w-full h-full flex flex-col items-center border border-dashed rounded-md transition-shadow duration-300 hover:shadow-lg overflow-auto" 
        :class="{
            'hover:shadow-gray-300': getSecondaryColorByCurrentColor.tailwind === 'gray-300',
            'hover:shadow-neutral-600': getSecondaryColorByCurrentColor.tailwind === 'neutral-600'
        }"
    >
        <svg ref="svgRef" :width="width" :height="height" preserveAspectRatio="xMidYMid meet">
        </svg>
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

/* Add these styles to enable panning */
.node {
    cursor: pointer;
}

/* Enable smooth transitions */
.node, .link {
    transition: all 0.3s ease-in-out;
}
</style>