<script setup lang="ts">
import type { AutoStyleClass } from '@/types/auto-styles';
const autoStyleClass: AutoStyleClass = 'auto-style-wrapper-as';
const componentName = 'AutoStyleWrapper'
</script>

<template>
    <component 
        v-auto-style:[componentName]
        class="auto-style-wrapper" :class="autoStyleClass"
    >
        <slot></slot>
    </component>
</template>