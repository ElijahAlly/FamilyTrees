<script setup lang="ts">
import type { AutoStyleClass } from '@/types/auto-styles';

const autoStyleClass: AutoStyleClass = 'app-as';
</script>

<template>
    <NuxtLayout :class="autoStyleClass">
        <NuxtPage />
    </NuxtLayout>
</template>