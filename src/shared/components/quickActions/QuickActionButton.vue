<script setup lang="ts">
withDefaults(defineProps<{
	label: string;
	/** raw svg markup */
	icon: string;
	/** a toggle that is on is drawn darker */
	active?: boolean;
	disabled?: boolean;
	/** which side of the button the tooltip opens to; away from the edge the bar sits on */
	tooltipSide: 'left' | 'right' | 'bottom';
}>(), { active: undefined, disabled: false });

defineEmits<{
	click: [];
}>();
</script>

<template>
	<button type="button" class="quick-action-button" :class="[`quick-action-button--tooltip-${tooltipSide}`, { 'is-active': active }]"
		:data-tooltip="label" :aria-label="label" :aria-pressed="active === undefined ? undefined : active" :disabled="disabled" @click="$emit('click')">
		<span class="quick-action-button__icon" v-html="icon"></span>
	</button>
</template>

<style scoped>
.quick-action-button {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 26px;
	height: 26px;
	padding: 0;
	border: 1px solid var(--color-border-subtle);
	border-radius: 0;
	background: var(--color-surface-chrome);
	color: var(--color-text);
	cursor: pointer;
}

/* 30% more opaque than the shared --color-fill-hover / -strong / -strong-hover, so the canvas shows through less */
.quick-action-button:hover {
	background: rgb(var(--color-text-rgb) / 0.15);
}

/* dead but still hoverable, so the tooltip keeps telling what the button does; the hover colour does not change */
.quick-action-button:disabled {
	cursor: default;
}

/* only the icon is dimmed: the tooltip is part of the button and must stay readable */
.quick-action-button:disabled .quick-action-button__icon {
	opacity: 0.4;
}

.quick-action-button:disabled:hover {
	background: var(--color-surface-chrome);
}

/* a toggle that is on; the hover is darker still so it keeps showing */
.quick-action-button.is-active {
	background: rgb(var(--color-text-rgb) / 0.15);
}

.quick-action-button.is-active:hover {
	background: rgb(var(--color-text-rgb) / 0.20);
}

.quick-action-button__icon {
	display: block;
	width: 16px;
	height: 16px;
}

/*
 * The tooltip is drawn from the data-tooltip attribute and not the native title attribute, because the browser
 * decides when a title appears and that cannot be sped up. It opens to the side away from the canvas edge the bar
 * sits on, and shows for hover and for keyboard focus. The delay is the transition-delay on the open state.
 */
.quick-action-button::after {
	content: attr(data-tooltip);
	position: absolute;
	top: 50%;
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

.quick-action-button--tooltip-right::after {
	left: calc(100% + 6px);
}

.quick-action-button--tooltip-left::after {
	right: calc(100% + 6px);
}

/* opens below the button, for a bar at the top of the canvas; overrides the vertical centering of the base */
.quick-action-button--tooltip-bottom::after {
	top: calc(100% + 6px);
	left: 50%;
	transform: translateX(-50%);
}

.quick-action-button:hover::after,
.quick-action-button:focus-visible::after {
	opacity: 1;
	/* the 100 ms wait before it shows, so moving the mouse across the bar does not flash it */
	transition-delay: 0.1s;
}

.quick-action-button__icon :deep(svg) {
	display: block;
	width: 100%;
	height: 100%;
}

.quick-action-button__icon :deep(path:not(.icon-fill)),
.quick-action-button__icon :deep(circle) {
	stroke: currentColor;
}

/* the filled parts of an icon follow the text color like the strokes do, and have no outline of their own */
.quick-action-button__icon :deep(.icon-fill) {
	fill: currentColor;
	stroke: none;
}
</style>
