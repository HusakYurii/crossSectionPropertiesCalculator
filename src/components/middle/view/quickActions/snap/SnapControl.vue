<script setup lang="ts">
import magnetIconRaw from '../../../../../svg/magnet.svg?raw';
import QuickActionButton from '../QuickActionButton.vue';
import { useSnapControl } from './useSnapControl';

withDefaults(defineProps<{
	/** 26 px tall instead of 32, to line up with the form fields next to it (the custom shape editor) */
	compact?: boolean;
}>(), { compact: false });

const { enabled, step, toggle, options } = useSnapControl();

function onStepChange(event: Event) {
	step.value = Number((event.target as HTMLSelectElement).value) as typeof step.value;
	// the arrow keys of a focused select would keep changing the step (undo still works: see data-allow-history-shortcuts)
	(event.target as HTMLSelectElement).blur();
}
</script>

<template>
	<div class="snap-control" :class="{ 'snap-control--compact': compact }">
		<QuickActionButton label="Snap to grid step" :icon="magnetIconRaw" :active="enabled" tooltip-side="bottom"
			@click="toggle" />
		<div class="snap-control__select-wrap" :class="{ 'is-off': !enabled }">
			<select class="snap-control__select" :value="step" aria-label="Snap step" title="Snap step"
				data-allow-history-shortcuts @change="onStepChange">
				<option v-for="option in options" :key="option.value" :value="option.value">{{ option.label }}</option>
			</select>
		</div>
	</div>
</template>

<style scoped>
/* one 32 px tall group: the magnet and the step next to it */
.snap-control {
	display: flex;
	height: 32px;
}

.snap-control__select-wrap {
	position: relative;
	display: flex;
	margin-left: -1px;
}

/* the chevron; drawn here because appearance: none removes the native one */
.snap-control__select-wrap::after {
	content: '';
	position: absolute;
	top: 50%;
	right: 9px;
	width: 5px;
	height: 5px;
	border-right: 1.5px solid currentColor;
	border-bottom: 1.5px solid currentColor;
	color: var(--color-text);
	pointer-events: none;
	transform: translateY(-70%) rotate(45deg);
}

.snap-control__select {
	height: 32px;
	padding: 0 24px 0 8px;
	border: 1px solid var(--color-border-subtle);
	border-radius: 0;
	background: var(--color-surface-chrome);
	color: var(--color-text);
	font-size: 12px;
	cursor: pointer;
	appearance: none;
}

.snap-control__select:hover {
	background: rgb(var(--color-text-rgb) / 0.21);
}

/* the compact size: the magnet square and the select shrink together */
.snap-control--compact {
	height: 26px;
}

.snap-control--compact :deep(.quick-action-button) {
	width: 26px;
	height: 26px;
}

.snap-control--compact :deep(.quick-action-button__icon) {
	width: 15px;
	height: 15px;
}

.snap-control--compact .snap-control__select {
	height: 26px;
}

/* dimmed while the magnet is off, but still usable */
.snap-control__select-wrap.is-off {
	opacity: 0.55;
}
</style>
