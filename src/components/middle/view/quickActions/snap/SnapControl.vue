<script setup lang="ts">
import magnetIconRaw from '../../../../../svg/magnet.svg?raw';
import QuickActionButton from '../QuickActionButton.vue';
import { useSnapControl } from './useSnapControl';

const { enabled, step, toggle, options } = useSnapControl();

function onStepChange(event: Event) {
	step.value = Number((event.target as HTMLSelectElement).value) as typeof step.value;
	// the arrow keys of a focused select would keep changing the step (undo still works: see data-allow-history-shortcuts)
	(event.target as HTMLSelectElement).blur();
}
</script>

<template>
	<div class="snap-control">
		<QuickActionButton label="Snap to grid step" :icon="magnetIconRaw" :active="enabled" tooltip-side="bottom"
			@click="toggle" />
		<div class="snap-control__select-wrap" :class="{ 'is-off': !enabled }">
			<select class="snap-control__select" :value="step" aria-label="Snap step" title="Snap step" name="steps-options"
				data-allow-history-shortcuts @change="onStepChange">
				<option v-for="option in options" :key="option.value" :value="option.value">{{ option.label }}</option>
			</select>
		</div>
	</div>
</template>

<style scoped>
/* one 26 px tall group: the magnet and the step next to it */
.snap-control {
	display: flex;
	height: 26px;
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
	height: 26px;
	padding: 0 24px 0 8px;
	border: 1px solid var(--color-border-subtle);
	border-radius: 0;
	background: var(--color-surface-chrome);
	color: var(--color-text);
	font-size: 12px;
	cursor: pointer;
	appearance: none;
}

/* dimmed while the magnet is off, but still usable */
.snap-control__select-wrap.is-off {
	opacity: 0.55;
}

/* Chromium's customizable select: the list drops down below the control and matches its look.
   Other browsers keep the native list (the rules above) */
@supports (appearance: base-select) {
	.snap-control__select,
	.snap-control__select::picker(select) {
		appearance: base-select;
	}

	/* keep the hand-drawn chevron on the wrapper */
	.snap-control__select::picker-icon {
		display: none;
	}

	/* base-select sizes the button to the selected label; pin the width of the longest one ("0.05 mm", 7 characters)
	   plus the 8 px left and 24 px right padding and the 2 px border, so it doesn't jump between steps */
	.snap-control__select {
		min-inline-size: calc(7ch + 34px);
		/* base-select lays the button out as a box with its own block padding; center the label in the fixed height */
		display: inline-flex;
		align-items: center;
		padding-block: 0;
		line-height: normal;
	}

	/* the list: drops down from the select, same surface as the control and the nav menus */
	.snap-control__select::picker(select) {
		position-area: block-end span-inline-end;
		position-try-fallbacks: flip-block, flip-inline;
		min-inline-size: anchor-size(self-inline);
		margin: 0;
		margin-block-start: -1px; /* shares the select's bottom border */
		padding: 0;
		border: 1px solid var(--color-border-subtle);
		border-radius: 0;
		background: var(--color-surface-chrome);
		box-shadow: 0 4px 12px var(--color-shadow);
	}

	.snap-control__select option {
		padding: 6px 8px;
		background: transparent;
		cursor: pointer;
		transition: background-color 0.35s;
	}

	.snap-control__select option::checkmark {
		display: none;
	}

	.snap-control__select option:checked {
		background: var(--color-fill-active);
		font-weight: 600;
	}

	/* after :checked so hovering the current step still shows */
	.snap-control__select option:is(:hover, :focus-visible) {
		background: var(--color-fill-hover);
		outline: none;
	}

	/* chevron flips while the list is open */
	.snap-control__select-wrap:has(.snap-control__select:open)::after {
		transform: translateY(-30%) rotate(225deg);
	}
}
</style>
