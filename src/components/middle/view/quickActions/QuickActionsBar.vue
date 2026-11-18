<script setup lang="ts">
import centerIconRaw from '../../../../svg/center.svg?raw';
import resetZoomIconRaw from '../../../../svg/reset-zoom.svg?raw';
import fitScreenIconRaw from '../../../../svg/fit-screen.svg?raw';
import hatchIconRaw from '../../../../svg/hatch.svg?raw';
import { appSessionState, setShowHatching } from '../../../../store/appSessionState';
import QuickActionButton from './QuickActionButton.vue';
import SnapControl from './snap/SnapControl.vue';

const emit = defineEmits<{
	center: [];
	'reset-zoom': [];
	'fit-to-screen': [];
}>();

// quick actions: each one is a square icon button in the bar above the canvas
const QUICK_ACTIONS = [
	{ id: 'center', label: 'Center the canvas', icon: centerIconRaw, run: () => emit('center') },
	{ id: 'reset-zoom', label: 'Reset zoom', icon: resetZoomIconRaw, run: () => emit('reset-zoom') },
	{ id: 'fit-to-screen', label: 'Fit to screen', icon: fitScreenIconRaw, run: () => emit('fit-to-screen') },
];
</script>

<template>
	<div class="quick-actions-bar" role="toolbar" aria-label="Canvas view">
		<QuickActionButton v-for="action in QUICK_ACTIONS" :key="action.id" :label="action.label" :icon="action.icon"
			tooltip-side="bottom" @click="action.run" />
		<span class="quick-actions-bar__divider" role="separator" aria-orientation="vertical"></span>
		<SnapControl />
		<span class="quick-actions-bar__divider" role="separator" aria-orientation="vertical"></span>
		<QuickActionButton label="Hatching" :icon="hatchIconRaw" :active="appSessionState.showHatching" tooltip-side="bottom"
			@click="setShowHatching(!appSessionState.showHatching)" />
		<template v-if="$slots.default">
			<span class="quick-actions-bar__divider" role="separator" aria-orientation="vertical"></span>
			<slot />
		</template>
	</div>
</template>

<style scoped>
/* quick actions bar: floats over the top center of the canvas, opaque in the sidebar color, as wide as its content */
.quick-actions-bar {
	position: absolute;
	top: 8px;
	left: 50%;
	z-index: 2;
	display: flex;
	align-items: center;
	gap: 4px;
	padding: 4px;
	border: 1px solid var(--color-border-subtle);
	background: var(--color-surface-sidebar);
	transform: translateX(-50%);
}

/* a thin line between the groups of the bar */
.quick-actions-bar__divider {
	width: 1px;
	height: 18px;
	margin: 0 4px;
	background: var(--color-border-subtle);
}
</style>
