<script setup lang="ts">
import type { AutoStyleClass } from '@/types/auto-styles';

const autoStyleClass: AutoStyleClass = 'family-sunburst-chart-as';
</script>

<script lang="ts" setup>
import * as echarts from 'echarts';

// type EChartsOption = echarts.EChartsOption;

// const chartDom = document.getElementById('sunburst-chart')!;
// const myChart = echarts.init(chartDom, 'dark');
// let option: EChartsOption;

// function transformToEChartsSunburst(node: FamilyTreeNodeType | null): any {
//   if (!node) return node;

//   const transformedNode: any = {
//     name: node.member.first_name, // Assuming `name` is a property of `PersonType`
//     value: node.children.length || 1, // Set the value based on children or a default of 1
//     nodeClick: 'rootToNode', // This is an example; you might adjust based on your needs
//     children: []
//   };

//   if (node.children && node.children.length > 0) {
//     transformedNode.children = node.children.map(child => transformToEChartsSunburst(child));
//   }

//   // Optional: You can add more properties like `itemStyle`, `collapsed`, etc.
//   // if (node.spouse) {
//   //   transformedNode.children.push({
//   //     name: node.spouse.name,
//   //     value: 1, // Spouse's value
//   //     children: node.marriages.map((marriage: Marr) => transformToEChartsSunburst({
//   //       member: marriage,
//   //       marriages: [],
//   //       spouse: null,
//   //       children: [],
//   //       familyId: node.familyId,
//   //       level: node.level + 1
//   //     }))
//   //   });
//   // }

//   return transformedNode;
// }

// const echartsData = transformToEChartsSunburst(familyStore.curentFamilyTree);

// function calculateLevels(data: any, maxRadius = '100%') {
//   const levels = [];
//   const numberOfLevels = getDepth(data);
//   const radiusIncrement = 100 / numberOfLevels;

//   for (let i = 0; i < numberOfLevels; i++) {
//     levels.push({
//       r0: `${i * radiusIncrement}%`,
//       r: `${(i + 1) * radiusIncrement}%`,
//       label: {
//         align: i === numberOfLevels - 1 ? 'right' : 'tangential',
//         rotate: i === numberOfLevels - 1 ? 'radial' : 'tangential', // Ensures type compatibility
//         position: i === numberOfLevels - 1 ? 'outside' : 'inside',
//         padding: i === numberOfLevels - 1 ? 3 : 0,
//         silent: false,
//         fontSize: 10,
//       }
//     });
//   }

//   return levels;
// }

// function getDepth(node: any) {
//   if (!node.children || node.children.length === 0) {
//     return 1;
//   }
//   return 1 + Math.max(...node.children.map(getDepth));
// }

// option = {
//   visualMap: {
//     type: 'continuous',
//     min: 0,
//     max: 10,
//     inRange: {
//       color: ['#c4b5fd', '#2e1065', '#0f172a', '#cbd5e1']
//     }
//   },
//   series: {
//     type: 'sunburst',
//     data: [echartsData],
//     radius: [0, '90%'],
//     label: {
//       rotate: 'radial', // Ensures labels rotate based on their position in the circle
//       align: 'right', // Aligns labels outside the sectors to avoid overlap
//       fontSize: 10, // Adjust font size to fit better
//     },
//   }
// };

// option && myChart.setOption(option);

// onMounted(async () => {
//   try {
//     if (familyStore.curentFamilyTree) {
//       return;
//     }

//     const { data: families, error }: FetchTypeList = await $fetch('/api/get-family-by-id', {
//       method: 'GET',
//       params: {
//         table: 'families',
//         select: '*',
//         eq: 'id',
//         id: route.params.familyId
//       }
//     });
    
//     if (error) throw error;
//   } catch (err) {
//     console.error(err);
//   }
// })
</script>

<template>
    <div :class="autoStyleClass">
        <!-- <div id="sunburst-chart" v-if="draggableZoneStore.curDisplayType === 'arcticons:graphene-os'" class="w-[60vw] h-[60vh]"> -->
    </div>
</template>