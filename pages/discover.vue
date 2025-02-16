<script setup lang="ts">
import type { AutoStyleClass } from '@/types/auto-styles';
const autoStyleClass: AutoStyleClass = 'discover-as';
</script>

<template>
    <div class="w-full h-full pt-24" :class="autoStyleClass">
        <DiscoverSplit />
    </div>
</template>