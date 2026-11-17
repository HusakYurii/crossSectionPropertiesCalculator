<script setup lang="ts">
import { ref } from 'vue';
import MenuWithDropDown from './MenuWithDropDown.vue';
import ConfirmModal from '../ConfirmModal.vue';
import SaveProjectModal from '../SaveProjectModal.vue';
import {  uploadJSON } from '../../../fileLoader/uploadFile.ts';

import { importStoreData, loadProjectData} from '../../../store/storeDataImporter.ts';
import { EMPTY_PROJECT, exportStoreData } from '../../../store/storeDataExporter.ts';
import { store } from '../../../store/store.ts';
import { history } from '../../../store/history.ts';
import { compositeCrossSectionPropertiesSolver } from '../../../solvers/CompositeCrossSectionPropertiesSolver.ts';
import { createReportSnapshot, saveReportSnapshot } from '../../../pages/report/reportSnapshot.ts';
import { toast } from 'vue3-toastify';

type ActionNames = "import" | "export" | "results" | 'new';

const isNewProjectConfirmOpen = ref(false);
const isImportConfirmOpen = ref(false);
const isSaveProjectModalOpen = ref(false);

// undo/redo can bring deleted shapes back, so the history counts too
function hasWorkToLose() {
	return Object.keys(store.geometry).length > 0 || history.canUndo.value || history.canRedo.value;
}

function importProject() {
	uploadJSON((file) => {
		importStoreData(file)
	})
}

// runs inside the Confirm click handler: keep it synchronous so the file picker keeps user activation
function onImportConfirm() {
	isImportConfirmOpen.value = false;
	importProject();
}

function onImportReject() {
	isImportConfirmOpen.value = false;
}

function createNewProject() {
	loadProjectData(EMPTY_PROJECT);
	toast.info('New project created');
}

function onNewProjectConfirm() {
	isNewProjectConfirmOpen.value = false;
	createNewProject();
}

function onNewProjectReject() {
	isNewProjectConfirmOpen.value = false;
}

function onSaveProjectConfirm(name: string) {
	isSaveProjectModalOpen.value = false;
	exportStoreData(name);
}

function onSaveProjectReject() {
	isSaveProjectModalOpen.value = false;
}

const ACTIONS_STRATEGIES: Record<ActionNames, () => void> = {
	new: () => {
		if (hasWorkToLose()) {
			isNewProjectConfirmOpen.value = true;
			return;
		}
		createNewProject();
	},
	import: () => {
		if (hasWorkToLose()) {
			isImportConfirmOpen.value = true;
			return;
		}
		importProject();
	},
	export: () => {
		isSaveProjectModalOpen.value = true;
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
	<ConfirmModal v-if="isNewProjectConfirmOpen" title="New Project"
		message="Start a new project? Unsaved changes and the undo history will be lost."
		confirm-label="Create" :on-confirm="onNewProjectConfirm" :on-reject="onNewProjectReject" />
	<ConfirmModal v-if="isImportConfirmOpen" title="Import Project"
		message="Importing a project will replace the current one. Unsaved changes and the undo history will be lost."
		confirm-label="Import" :on-confirm="onImportConfirm" :on-reject="onImportReject" />
	<SaveProjectModal v-if="isSaveProjectModalOpen" :on-confirm="onSaveProjectConfirm"
		:on-reject="onSaveProjectReject" />
</template>
