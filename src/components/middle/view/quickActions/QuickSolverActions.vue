<script setup lang="ts">
import centroidIconRaw from '../../../../svg/centroid.svg?raw';
import principalAxesIconRaw from '../../../../svg/principal-axes.svg?raw';
import gyrationIconRaw from '../../../../svg/gyration.svg?raw';
import { type QuickSolverToggleKey, type QuickSolverToggles } from '../../../../interfaces/quickSolverToggles';
import QuickActionButton from './QuickActionButton.vue';

defineProps<{
	toggles: QuickSolverToggles;
}>();

const emit = defineEmits<{
	toggle: [key: QuickSolverToggleKey];
}>();

// solver actions bar: toggles for what the whole section shows on the canvas, in the top right corner
const SOLVER_ACTION_CONFIG: Record<QuickSolverToggleKey, { label: string; icon: string }> = {
	centroid: { label: 'Show section centroid coordinates', icon: centroidIconRaw },
	principalAxes: { label: 'Show principal axes', icon: principalAxesIconRaw },
	gyration: { label: 'Show radius of gyration', icon: gyrationIconRaw },
};
const SOLVER_ACTIONS = (Object.keys(SOLVER_ACTION_CONFIG) as QuickSolverToggleKey[])
	.map((key) => ({ key, ...SOLVER_ACTION_CONFIG[key] }));
</script>

<template>
	<div class="quick-solver-actions">
		<QuickActionButton v-for="action in SOLVER_ACTIONS" :key="action.key" :label="action.label" :icon="action.icon"
			:active="toggles[action.key]" tooltip-side="left" @click="emit('toggle', action.key)" />
	</div>
</template>

<style scoped>
/* a column of squares in the top right corner, over the canvas; the mirror of the quick actions bar */
.quick-solver-actions {
	position: absolute;
	top: 8px;
	right: 8px;
	z-index: 1;
	display: flex;
	flex-direction: column;
	gap: 4px;
}
</style>
