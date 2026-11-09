<script lang="ts">
</script>
<template>
    <div class="spinner-wrapper">
        <div class="snipper-wrapper__spinner"></div>
    </div>
</template>

<style scoped>
    .spinner-wrapper {
        width: 100%;
        height: 100%;
        position: relative;
    }

    .snipper-wrapper__spinner {
        position: absolute;
        width: 40px;
        height: 40px;
        border-radius: 20px;
        background: conic-gradient(transparent, black);
        -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 5.5px), black calc(100% - 5px));
        mask: radial-gradient(farthest-side, transparent calc(100% - 5.5px), black calc(100% - 5px));
        inset: 0;
        margin: auto;
        animation: spin 5s linear infinite;
    }

    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }

</style>