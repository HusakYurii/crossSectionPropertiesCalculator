<script setup lang="ts">
import centerIconRaw from '@/shared/assets/icons/center.svg?raw';
import resetZoomIconRaw from '@/shared/assets/icons/reset-zoom.svg?raw';
import fitScreenIconRaw from '@/shared/assets/icons/fit-screen.svg?raw';
import QuickActionButton from './QuickActionButton.vue';
import type { CanvasViewActions } from './canvasViewActions.types';

const props = defineProps<{
	actions: CanvasViewActions;
}>();

// quick actions: each one is a square icon button in the bar above the canvas
const QUICK_ACTIONS = [
	{ id: 'center', label: 'Center the canvas', icon: centerIconRaw, run: () => props.actions.center() },
	{ id: 'reset-zoom', label: 'Reset zoom', icon: resetZoomIconRaw, run: () => props.actions.resetZoom() },
	{ id: 'fit-to-screen', label: 'Fit to screen', icon: fitScreenIconRaw, run: () => props.actions.fitToScreen() },
];
</script>

<template>
	<QuickActionButton v-for="action in QUICK_ACTIONS" :key="action.id" :label="action.label" :icon="action.icon"
		tooltip-side="bottom" @click="action.run" />
</template>
