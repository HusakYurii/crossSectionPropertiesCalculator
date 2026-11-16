<script setup lang="ts">
import MenuWithDropDown from './MenuWithDropDown.vue';
import {  uploadJSON } from '../../../fileLoader/uploadFile.ts';

import { importStoreData, loadProjectData} from '../../../store/storeDataImporter.ts';
import { EMPTY_PROJECT, exportStoreData } from '../../../store/storeDataExporter.ts';
import { store } from '../../../store/store.ts';
import { compositeCrossSectionPropertiesSolver } from '../../../solvers/CompositeCrossSectionPropertiesSolver.ts';
import { createReportSnapshot, saveReportSnapshot } from '../../../pages/report/reportSnapshot.ts';
import { toast } from 'vue3-toastify';

type ActionNames = "import" | "export" | "results" | 'new';

const ACTIONS_STRATEGIES: Record<ActionNames, () => void> = {
	new: () => {
		const hasShapes = Object.keys(store.geometry).length > 0;
		if (hasShapes && !window.confirm('Start a new project? Unsaved changes and the undo history will be lost.')) {
			return;
		}
		loadProjectData(EMPTY_PROJECT);
		toast.info('New project created');
	},
	import: () => {
		uploadJSON((file ) => {
			importStoreData(file)
		})
	},
	export: () => {
		exportStoreData();
	},
	results: () => {
		const properties = compositeCrossSectionPropertiesSolver.calculate(store);
		if (!(properties.A > 0)) return; // the solver already showed a toast saying why
		const id = saveReportSnapshot(createReportSnapshot());
		if (!id) {
			toast.error('Could not prepare the report: the project is too big to pass to a new tab.');
			return;
		}
		const url = new URL(window.location.href);
		url.search = '';
		url.hash = '';
		url.searchParams.set('report', id);
		// no `noopener`: with it window.open always returns null and a blocked pop-up could not be detected
		const tab = window.open(url, '_blank');
		if (!tab) {
			toast.error('The browser blocked the report tab. Allow pop-ups for this site and try again.')
		};
	},
}

const MAIN_MENU_ITEMS: Array<{ value: ActionNames, label: string }> = [
	{ value: 'new', label: 'New Project' },
	{ value: 'import', label: 'Import Project' },
	{ value: 'export', label: 'Export Project' },
	{ value: 'results', label: 'Show Results' },
];

function onFileSelect(action: ActionNames) {
	ACTIONS_STRATEGIES[action]();
}
</script>

<template>
	<MenuWithDropDown title="File" :items="MAIN_MENU_ITEMS" @select="onFileSelect" />
</template>
