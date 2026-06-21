<script lang="ts" setup>
import * as echarts from 'echarts';
import type { FamilyTreeNodeType } from '@/types';

const familyStore = useFamilyStore();
const personStore = usePersonStore();
const draggableZoneStore = useDraggableZoneStore();
const { treeCustomization } = storeToRefs(draggableZoneStore);

const chartRef = ref<HTMLDivElement | null>(null);
let chart: echarts.ECharts | null = null;

// Track the current "focused" root node for drill-down navigation
const focusedNode = ref<FamilyTreeNodeType | null>(null);
// Breadcrumb trail for navigating back
const breadcrumbs = ref<{ label: string; node: FamilyTreeNodeType }[]>([]);

const currentRoot = computed(() => focusedNode.value || familyStore.currentFamilyTree);

// Find a person's node anywhere in the full tree (for building "around" connections)
function findNodeById(root: FamilyTreeNodeType | null, personId: number): FamilyTreeNodeType | null {
    if (!root) return null;
    if (root.member.id === personId) return root;
    for (const child of root.children) {
        const found = findNodeById(child, personId);
        if (found) return found;
    }
    return null;
}

// Find the parent node of a given person in the tree
function findParentNode(root: FamilyTreeNodeType | null, personId: number): FamilyTreeNodeType | null {
    if (!root) return null;
    for (const child of root.children) {
        if (child.member.id === personId) return root;
        const found = findParentNode(child, personId);
        if (found) return found;
    }
    return null;
}

// Build a "connections" tree centered on any person:
// - Center: the person
// - Ring 1: spouse(s) + parents + children + siblings
function buildConnectionsTree(personId: number): any | null {
    const fullTree = familyStore.currentFamilyTree;
    if (!fullTree) return null;

    const node = findNodeById(fullTree, personId);
    if (!node) return null;

    const parentNode = findParentNode(fullTree, personId);
    const children: any[] = [];

    // Add spouse(s)
    if (node.spouse) {
        children.push({
            name: formatName(node.spouse.firstName, node.spouse.lastName),
            value: 1,
            personId: node.spouse.id,
            relationship: 'Spouse',
            itemStyle: { color: '#8b5cf6' },
            children: [],
        });
    }
    for (const marriage of node.marriages) {
        if (marriage.id !== node.spouse?.id) {
            children.push({
                name: formatName(marriage.firstName, marriage.lastName),
                value: 1,
                personId: marriage.id,
                relationship: 'Spouse',
                itemStyle: { color: '#8b5cf6' },
                children: [],
            });
        }
    }

    // Add parents
    if (parentNode) {
        children.push({
            name: formatName(parentNode.member.firstName, parentNode.member.lastName),
            value: 1,
            personId: parentNode.member.id,
            relationship: 'Parent',
            itemStyle: { color: '#059669' },
            children: [],
        });
        if (parentNode.spouse) {
            children.push({
                name: formatName(parentNode.spouse.firstName, parentNode.spouse.lastName),
                value: 1,
                personId: parentNode.spouse.id,
                relationship: 'Parent',
                itemStyle: { color: '#059669' },
                children: [],
            });
        }
    }

    // Add siblings (other children of the same parent)
    if (parentNode) {
        for (const sibling of parentNode.children) {
            if (sibling.member.id !== personId) {
                children.push({
                    name: formatName(sibling.member.firstName, sibling.member.lastName),
                    value: 1,
                    personId: sibling.member.id,
                    relationship: 'Sibling',
                    itemStyle: { color: '#d97706' },
                    children: [],
                });
            }
        }
    }

    // Add children of this person
    for (const child of node.children) {
        children.push({
            name: formatName(child.member.firstName, child.member.lastName),
            value: Math.max(1, child.children.length),
            personId: child.member.id,
            relationship: 'Child',
            itemStyle: { color: '#2563eb' },
            children: child.children.map(grandchild => ({
                name: formatName(grandchild.member.firstName, grandchild.member.lastName),
                value: 1,
                personId: grandchild.member.id,
                relationship: 'Grandchild',
                itemStyle: { color: '#6366f1' },
                children: [],
            })),
        });
    }

    return {
        name: formatName(node.member.firstName, node.member.lastName),
        value: Math.max(1, children.length),
        personId: node.member.id,
        itemStyle: { color: treeCustomization.value.nodeColor },
        children,
    };
}

function formatName(first: string, last: string): string {
    return `${first || ''} ${last || ''}`.trim() || 'Unknown';
}

// Transform the FamilyTreeNodeType hierarchy into ECharts sunburst data
function transformToSunburst(node: FamilyTreeNodeType, depth = 0): any {
    const memberName = formatName(node.member.firstName, node.member.lastName);
    const childrenData: any[] = [];

    // Include spouse as a leaf alongside children so they appear in the same ring
    if (node.spouse) {
        childrenData.push({
            name: `${formatName(node.spouse.firstName, node.spouse.lastName)}`,
            value: 1,
            personId: node.spouse.id,
            relationship: 'Spouse',
            itemStyle: {
                color: depth % 2 === 0 ? '#7c3aed' : '#8b5cf6',
                borderColor: '#1e1b4b',
                borderWidth: 1,
            },
            children: [],
        });
    }

    for (const child of node.children) {
        childrenData.push(transformToSunburst(child, depth + 1));
    }

    // Color generation based on depth for visual distinction
    const hue = (200 + depth * 45) % 360;
    const saturation = 55 + (depth % 3) * 10;
    const lightness = 35 + (depth % 4) * 8;

    return {
        name: memberName,
        value: childrenData.length > 0 ? childrenData.length : 1,
        personId: node.member.id,
        familyId: node.familyId,
        level: node.level,
        itemStyle: {
            color: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
            borderColor: '#0f172a',
            borderWidth: 1.5,
        },
        children: childrenData,
    };
}

function getDepth(node: any): number {
    if (!node.children || node.children.length === 0) return 1;
    return 1 + Math.max(...node.children.map(getDepth));
}

// Mode: 'hierarchy' shows the tree top-down, 'connections' shows focused person's relationships
const viewMode = ref<'hierarchy' | 'connections'>('hierarchy');

function buildChartData() {
    if (viewMode.value === 'connections' && focusedNode.value) {
        return buildConnectionsTree(focusedNode.value.member.id);
    }

    const root = currentRoot.value;
    if (!root) return null;
    return transformToSunburst(root);
}

function buildOption(data: any): echarts.EChartsOption {
    const depth = getDepth(data);

    const levels: any[] = [];
    for (let i = 0; i < depth + 1; i++) {
        const isOutermost = i === depth;
        levels.push({
            r0: i === 0 ? '0%' : `${(i / (depth + 1)) * 100}%`,
            r: `${((i + 1) / (depth + 1)) * 100}%`,
            label: {
                rotate: i <= 1 ? 0 : 'tangential',
                align: isOutermost ? 'right' : 'center',
                position: isOutermost ? 'outside' : 'inside',
                padding: isOutermost ? 4 : 0,
                fontSize: i === 0 ? 13 : Math.max(9, 12 - i),
                fontWeight: i === 0 ? 'bold' : 'normal',
                color: '#e2e8f0',
                overflow: 'truncate',
                ellipsis: '..',
                width: i === 0 ? 80 : 70,
            },
            itemStyle: {
                borderWidth: i === 0 ? 3 : 1.5,
                borderColor: '#0f172a',
            },
        });
    }

    return {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'item',
            formatter: (params: any) => {
                const data = params.data;
                let tip = `<strong>${data.name}</strong>`;
                if (data.relationship) {
                    tip += `<br/><em>${data.relationship}</em>`;
                }
                if (data.children && data.children.length > 0) {
                    tip += `<br/>${data.children.length} connection${data.children.length > 1 ? 's' : ''}`;
                }
                return tip;
            },
        },
        series: {
            type: 'sunburst',
            data: [data],
            radius: ['0%', '85%'],
            sort: undefined,
            emphasis: {
                focus: 'ancestor',
                itemStyle: {
                    shadowBlur: 20,
                    shadowColor: 'rgba(124, 58, 237, 0.5)',
                },
            },
            levels,
            label: {
                rotate: 'tangential',
                color: '#e2e8f0',
                fontSize: 10,
            },
            itemStyle: {
                borderColor: '#0f172a',
                borderWidth: 1.5,
            },
            nodeClick: false, // We handle clicks ourselves
        },
    };
}

function handleChartClick(params: any) {
    const data = params.data;
    if (!data || !data.personId) return;

    const fullTree = familyStore.currentFamilyTree;
    if (!fullTree) return;

    const clickedNode = findNodeById(fullTree, data.personId);

    // Select the person in the person store for the sidebar
    if (clickedNode) {
        personStore.selectedPersonInTree = clickedNode.member;
    }

    // If the clicked node has children in the tree, drill into it
    if (clickedNode && clickedNode.children.length > 0) {
        // Push current root to breadcrumbs
        if (currentRoot.value) {
            const existing = breadcrumbs.value.find(b => b.node.member.id === currentRoot.value!.member.id);
            if (!existing) {
                breadcrumbs.value.push({
                    label: formatName(currentRoot.value.member.firstName, currentRoot.value.member.lastName),
                    node: currentRoot.value,
                });
            }
        }
        focusedNode.value = clickedNode;
        viewMode.value = 'hierarchy';
        renderChart();
    } else if (clickedNode) {
        // Leaf node or outermost: switch to connections view centered on this person
        breadcrumbs.value.push({
            label: formatName(
                (focusedNode.value || fullTree).member.firstName,
                (focusedNode.value || fullTree).member.lastName,
            ),
            node: focusedNode.value || fullTree,
        });
        focusedNode.value = clickedNode;
        viewMode.value = 'connections';
        renderChart();
    }
}

function navigateToBreadcrumb(index: number) {
    const crumb = breadcrumbs.value[index];
    focusedNode.value = crumb.node === familyStore.currentFamilyTree ? null : crumb.node;
    viewMode.value = 'hierarchy';
    breadcrumbs.value = breadcrumbs.value.slice(0, index);
    renderChart();
}

function resetToRoot() {
    focusedNode.value = null;
    viewMode.value = 'hierarchy';
    breadcrumbs.value = [];
    renderChart();
}

const isVisible = computed(() => draggableZoneStore.curDisplayType === 'arcticons:graphene-os');

let resizeObserver: ResizeObserver | null = null;

function initChart() {
    if (chart || !chartRef.value) return;

    chart = echarts.init(chartRef.value, 'dark');
    chart.on('click', handleChartClick);

    resizeObserver = new ResizeObserver(() => {
        chart?.resize();
    });
    resizeObserver.observe(chartRef.value);

    renderChart();
}

function destroyChart() {
    resizeObserver?.disconnect();
    resizeObserver = null;
    chart?.dispose();
    chart = null;
}

function renderChart() {
    if (!chart || !currentRoot.value) return;

    const data = buildChartData();
    if (!data) return;

    const option = buildOption(data);
    chart.setOption(option, true);
}

// Initialize chart when the sunburst view becomes visible
watch(isVisible, async (visible) => {
    if (visible) {
        await nextTick();
        initChart();
    } else {
        destroyChart();
    }
});

onMounted(async () => {
    if (isVisible.value) {
        await nextTick();
        initChart();
    }
});

onBeforeUnmount(() => {
    destroyChart();
});

// Re-render when the family tree data changes
watch(() => familyStore.currentFamilyTree, () => {
    focusedNode.value = null;
    breadcrumbs.value = [];
    viewMode.value = 'hierarchy';
    if (isVisible.value) {
        nextTick(() => {
            if (!chart) initChart();
            else renderChart();
        });
    }
}, { deep: true });

// Re-render when customization changes
watch(treeCustomization, () => {
    renderChart();
}, { deep: true });
</script>

<template>
    <div v-show="isVisible" class="flex flex-col items-center w-full h-full">
        <!-- Breadcrumb navigation -->
        <div class="flex items-center gap-1 px-4 py-2 text-sm text-zinc-400 flex-wrap z-10">
            <button
                @click="resetToRoot"
                class="hover:text-white transition-colors px-1.5 py-0.5 rounded hover:bg-zinc-700/50"
                :class="{ 'text-white font-semibold': !focusedNode && viewMode === 'hierarchy' }"
            >
                Root
            </button>
            <template v-for="(crumb, i) in breadcrumbs" :key="i">
                <span class="text-zinc-600">/</span>
                <button
                    @click="navigateToBreadcrumb(i)"
                    class="hover:text-white transition-colors px-1.5 py-0.5 rounded hover:bg-zinc-700/50"
                >
                    {{ crumb.label }}
                </button>
            </template>
            <template v-if="focusedNode">
                <span class="text-zinc-600">/</span>
                <span class="text-white font-semibold px-1.5 py-0.5">
                    {{ formatName(focusedNode.member.firstName, focusedNode.member.lastName) }}
                </span>
                <span v-if="viewMode === 'connections'"
                    class="ml-1 text-xs bg-violet-600/30 text-violet-300 px-2 py-0.5 rounded-full">
                    connections
                </span>
            </template>
        </div>

        <!-- Chart container -->
        <div ref="chartRef" class="w-[60vw] h-[55vh] min-h-[400px]" />

        <!-- Legend for connections mode -->
        <div v-if="viewMode === 'connections'" class="flex items-center gap-4 text-xs text-zinc-400 mt-1">
            <span class="flex items-center gap-1">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" /> Parent
            </span>
            <span class="flex items-center gap-1">
                <span class="w-2.5 h-2.5 rounded-full bg-violet-500 inline-block" /> Spouse
            </span>
            <span class="flex items-center gap-1">
                <span class="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block" /> Sibling
            </span>
            <span class="flex items-center gap-1">
                <span class="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" /> Child
            </span>
            <span class="flex items-center gap-1">
                <span class="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" /> Grandchild
            </span>
        </div>

        <p class="text-xs text-zinc-500 mt-1">Click a segment to drill in. Click outermost leaves to see their connections.</p>
    </div>
</template>
