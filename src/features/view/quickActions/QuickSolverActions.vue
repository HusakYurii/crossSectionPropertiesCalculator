<script setup lang="ts">
import centroidIconRaw from '../assets/centroid.svg?raw';
import principalAxesIconRaw from '../assets/principal-axes.svg?raw';
import gyrationIconRaw from '../assets/gyration.svg?raw';
import overlaysLayersIconRaw from '../assets/overlays-layers.svg?raw';
import type { QuickSolverToggleKey, QuickSolverToggles } from '@/store/viewToggles.types';
import QuickToggleDropdown from '@/shared/components/quickActions/QuickToggleDropdown.vue';

defineProps<{
	toggles: QuickSolverToggles;
}>();

const emit = defineEmits<{
	toggle: [key: QuickSolverToggleKey];
}>();

// solver actions: a dropdown in the quick actions bar with toggles for what the whole section shows on the canvas
const SOLVER_ACTION_CONFIG: Record<QuickSolverToggleKey, { label: string; icon: string }> = {
	centroid: { label: 'Section centroid', icon: centroidIconRaw },
	principalAxes: { label: 'Principal axes', icon: principalAxesIconRaw },
	gyration: { label: 'Radius of gyration', icon: gyrationIconRaw },
};
const SOLVER_ACTIONS = (Object.keys(SOLVER_ACTION_CONFIG) as QuickSolverToggleKey[])
	.map((key) => ({ key, ...SOLVER_ACTION_CONFIG[key] }));
</script>

<template>
	<QuickToggleDropdown label="Solver preview options" :icon="overlaysLayersIconRaw" :options="SOLVER_ACTIONS"
		:toggles="toggles" @toggle="(key) => emit('toggle', key)" />
</template>
