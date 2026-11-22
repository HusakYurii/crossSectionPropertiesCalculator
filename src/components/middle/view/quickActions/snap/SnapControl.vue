<script setup lang="ts">
import magnetIconRaw from '../../../../../svg/magnet.svg?raw';
import StyledSelectWrapper from '../../../../forms/components/StyledSelectWrapper.vue';
import QuickActionButton from '../QuickActionButton.vue';
import { useSnapControl } from './useSnapControl';

const { enabled, step, toggle, options } = useSnapControl();

function onStepChange(event: Event) {
	step.value = Number((event.target as HTMLSelectElement).value) as typeof step.value;
	// the arrow keys of a focused select would keep changing the step (blurring also hands the keys back to undo / redo)
	(event.target as HTMLSelectElement).blur();
}
</script>

<template>
	<div class="snap-control">
		<QuickActionButton label="Snap to grid step" :icon="magnetIconRaw" :active="enabled" tooltip-side="bottom"
			@click="toggle" />
		<StyledSelectWrapper class="snap-control__select-wrap" :class="{ 'is-off': !enabled }">
			<select class="snap-control__select" :value="step" aria-label="Snap step" title="Snap step" name="steps-options"
				@change="onStepChange">
				<option v-for="option in options" :key="option.value" :value="option.value">{{ option.label }}</option>
			</select>
		</StyledSelectWrapper>
	</div>
</template>

<style scoped>
/* one 26 px tall group: the magnet and the step next to it */
.snap-control {
	display: flex;
	height: 26px;
}

.snap-control__select-wrap {
	margin-left: -1px;
}

.snap-control__select {
	height: 26px;
	border-radius: 0;
}

/* dimmed while the magnet is off, but still usable */
.snap-control__select-wrap.is-off {
	opacity: 0.55;
}

@supports (appearance: base-select) {
	/* base-select sizes the button to the selected label; pin the width of the longest one ("0.05 mm", 7 characters)
	   plus the 8 px left and 24 px right padding and the 2 px border, so it doesn't jump between steps */
	.snap-control__select {
		min-inline-size: calc(7ch + 34px);
	}

	.snap-control__select::picker(select) {
		border-radius: 0;
	}
}
</style>
