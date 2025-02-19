<template>
    <div class="spinner"></div>
</template>

<style scoped>
.spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #cbd5e1;
    border-top: 4px solid #334155;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

.dark .spinner {
    border-color: #334155;
    border-top-color: #cbd5e1;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
</style>