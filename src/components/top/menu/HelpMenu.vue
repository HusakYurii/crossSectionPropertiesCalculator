<script setup lang="ts">
import { INFO_TOPICS, openInfoPanel } from '../../../store/infoPanel.ts';
import MenuWithNestedDropDown from './MenuWithNestedDropDown.vue';
import type { NestedMenuLevel } from './menu.types.ts';

const HELP_ITEMS: NestedMenuLevel<string> = {
		items: [
			{value: '', label: 'Solvers', children: {
				onSelect: openInfoPanel,
				items: [
					{ value: INFO_TOPICS.whatIsFEMSolver, label: 'FEM Solver' },
					{ value: INFO_TOPICS.whatIsGreensTheoremSolver, label: "Green's Theorem Solver" },
					{ value: INFO_TOPICS.whatIsCompositeSolver, label: "Composite Section Calculator" },
			]
			}},
			
			{ value: INFO_TOPICS.whatIsNegativeArea, label: 'Negative / Positive Area' },
			{ value: INFO_TOPICS.whatIsCustomShapeCsvFormat, label: 'CSV File Format' },
			{ value: INFO_TOPICS.aboutThisApp, label: 'About' },
		],
		onSelect: openInfoPanel
	}
;
</script>

<template>
	<MenuWithNestedDropDown title="Help" :level="HELP_ITEMS" />
</template>
