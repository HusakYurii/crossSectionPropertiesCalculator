<script setup lang="ts">
withDefaults(defineProps<{
	/** where along the top edge of the canvas the bar floats */
	align?: 'center' | 'right';
}>(), { align: 'center' });
</script>

<template>
	<div class="quick-actions-bar" :class="`quick-actions-bar--${align}`" role="toolbar" aria-label="Canvas tools">
		<slot />
	</div>
</template>

<style scoped>
/* quick actions bar: floats over the top of the canvas, opaque in the sidebar color, as wide as its content */
.quick-actions-bar {
	position: absolute;
	top: 8px;
	z-index: 2;
	display: flex;
	align-items: center;
	gap: 4px;
	padding: 4px;
	border: 1px solid var(--color-border-subtle);
	background: var(--color-surface-sidebar);
}

.quick-actions-bar--center {
	left: 50%;
	transform: translateX(-50%);
}

.quick-actions-bar--right {
	right: 8px;
}
</style>
