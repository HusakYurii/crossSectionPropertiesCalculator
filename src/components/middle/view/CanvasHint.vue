<script setup lang="ts">
defineProps<{
	/** short gestures, shown on one line separated by dots */
	items: string[];
}>();
</script>

<template>
	<p class="canvas-hint">{{ items.join(' | ') }}</p>
</template>

<style scoped>
/* sits in the bottom left corner of the nearest positioned parent and never takes mouse events */
.canvas-hint {
	position: absolute;
	left: 8px;
	bottom: 6px;
	margin: 0;
	font-size: 10.8px;
	color: var(--color-text);
	opacity: 0.6;
	pointer-events: none;
}
</style>
