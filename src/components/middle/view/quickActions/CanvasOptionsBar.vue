<script setup lang="ts">
import SnapControl from './snap/SnapControl.vue';
</script>

<template>
	<div class="canvas-options-bar">
		<SnapControl />
	</div>
</template>

<style scoped>
/* options bar: a row at the top center of the canvas, home for the settings of what the canvas does */
.canvas-options-bar {
	position: absolute;
	top: 8px;
	left: 50%;
	z-index: 1;
	display: flex;
	gap: 4px;
	transform: translateX(-50%);
	/* the gaps between the controls must not swallow canvas events */
	pointer-events: none;
}

.canvas-options-bar > * {
	pointer-events: auto;
}
</style>
