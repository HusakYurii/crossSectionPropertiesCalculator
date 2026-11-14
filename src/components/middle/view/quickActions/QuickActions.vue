<script setup lang="ts">
import centerIconRaw from '../../../../svg/center.svg?raw';
import resetZoomIconRaw from '../../../../svg/reset-zoom.svg?raw';
import fitScreenIconRaw from '../../../../svg/fit-screen.svg?raw';

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
		<button v-for="action in QUICK_ACTIONS" :key="action.id" type="button" class="quick-actions__button"
			:data-tooltip="action.label" :aria-label="action.label" @click="action.run">
			<span class="quick-actions__icon" v-html="action.icon"></span>
		</button>
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

.quick-actions__button {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	padding: 0;
	border: 1px solid var(--color-border-subtle);
	border-radius: 0;
	background: var(--color-surface-chrome);
	color: var(--color-text);
	cursor: pointer;
}

.quick-actions__button:hover {
	background: var(--color-fill-hover);
}

.quick-actions__icon {
	display: block;
	width: 18px;
	height: 18px;
}

/*
 * The tooltip is drawn from the data-tooltip attribute and not the native title attribute, because the browser
 * decides when a title appears and that cannot be sped up. It opens to the right of the button, since the bar sits
 * in the corner, and shows for hover and for keyboard focus. The delay is the transition-delay on the open state.
 */
.quick-actions__button::after {
	content: attr(data-tooltip);
	position: absolute;
	top: 50%;
	left: calc(100% + 6px);
	z-index: 2;
	padding: 4px 8px;
	border: 1px solid var(--color-border-subtle);
	background: var(--color-surface-chrome);
	box-shadow: 0 2px 6px var(--color-shadow);
	color: var(--color-text);
	font-size: 12px;
	white-space: nowrap;
	pointer-events: none;
	opacity: 0;
	transform: translateY(-50%);
	/* leaving is instant, so a tooltip never lingers over the canvas */
	transition: opacity 0.08s ease 0s;
}

.quick-actions__button:hover::after,
.quick-actions__button:focus-visible::after {
	opacity: 1;
	/* the 100 ms wait before it shows, so moving the mouse across the bar does not flash it */
	transition-delay: 0.1s;
}

.quick-actions__icon :deep(svg) {
	display: block;
	width: 100%;
	height: 100%;
}

.quick-actions__icon :deep(path),
.quick-actions__icon :deep(circle) {
	stroke: currentColor;
}
</style>
