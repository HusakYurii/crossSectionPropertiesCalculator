<script setup lang="ts">
import centerIconRaw from '../../../../svg/center.svg?raw';
import resetZoomIconRaw from '../../../../svg/reset-zoom.svg?raw';
import fitScreenIconRaw from '../../../../svg/fit-screen.svg?raw';
import QuickActionButton from './QuickActionButton.vue';

const emit = defineEmits<{
	center: [];
	'reset-zoom': [];
	'fit-to-screen': [];
}>();

// quick actions bar: each one is a square icon button in the top left corner of the canvas
const QUICK_ACTIONS = [
	{ id: 'center', label: 'Center the canvas', icon: centerIconRaw, run: () => emit('center') },
	{ id: 'reset-zoom', label: 'Reset zoom', icon: resetZoomIconRaw, run: () => emit('reset-zoom') },
	{ id: 'fit-to-screen', label: 'Fit to screen', icon: fitScreenIconRaw, run: () => emit('fit-to-screen') },
];
</script>

<template>
	<div class="quick-actions">
		<QuickActionButton v-for="action in QUICK_ACTIONS" :key="action.id" :label="action.label" :icon="action.icon"
			tooltip-side="right" @click="action.run" />
	</div>
</template>

<style scoped>
/* quick actions bar: a column of squares in the top left corner, over the canvas */
.quick-actions {
	position: absolute;
	top: 8px;
	left: 8px;
	z-index: 1;
	display: flex;
	flex-direction: column;
	gap: 4px;
}
</style>
