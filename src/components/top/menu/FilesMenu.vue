<script setup lang="ts">
import { nextTick, ref } from 'vue';
import MenuWithNestedDropDown from './MenuWithNestedDropDown.vue';
import ConfirmModal from '../ConfirmModal.vue';
import SaveProjectModal from '../SaveProjectModal.vue';
import { fileUploader } from '../../../services/singletons/FileUploader.ts';

import { importExampleProject, importStoreData, loadProjectData} from '../../../store/storeDataImporter.ts';
import { EXAMPLE_PROJECTS, type ExampleProjectId } from '../../../store/exampleProjects.ts';
import type { NestedMenuLevel } from '../../../interfaces/menu/menu.types.ts';
import { EMPTY_PROJECT, exportStoreData } from '../../../store/storeDataExporter.ts';
import { store } from '../../../store/store.ts';
import { history } from '../../../store/history.ts';
import { compositeCrossSectionPropertiesSolver } from '../../../solvers/CompositeCrossSectionPropertiesSolver.ts';
import { createReportSnapshot, saveReportSnapshot } from '../../../pages/report/reportSnapshot.ts';
import { toast } from 'vue3-toastify';
import { eventBus } from '../../../services/singletons/EventBus.ts';

type ActionNames = "import" | "export" | "results" | 'new';
// 'examples' only keys the parent item of the submenu, it is never dispatched
type FileMenuValue = ActionNames | 'examples';

const isNewProjectConfirmOpen = ref(false);
const isImportConfirmOpen = ref(false);
const isSaveProjectModalOpen = ref(false);
const pendingExampleId = ref<ExampleProjectId | null>(null);

// undo/redo can bring deleted shapes back, so the history counts too
function hasWorkToLose() {
	return Object.keys(store.geometry).length > 0 || history.canUndo.value || history.canRedo.value;
}

// after the next tick the View watchers have built the beams of the loaded project
function emitProjectLoaded() {
	nextTick(() => eventBus.emit('projectLoaded'));
}

function importProject() {
	fileUploader.uploadJSON(async (file) => {
		if (await importStoreData(file)) emitProjectLoaded();
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

async function openExample(id: ExampleProjectId) {
	if (await importExampleProject(EXAMPLE_PROJECTS[id].load)) emitProjectLoaded();
}

function onExampleSelect(id: ExampleProjectId) {
	if (hasWorkToLose()) {
		pendingExampleId.value = id;
		return;
	}
	openExample(id);
}

function onExampleConfirm() {
	const id = pendingExampleId.value;
	pendingExampleId.value = null;
	if (id) {
		openExample(id);
	}
}

function onExampleReject() {
	pendingExampleId.value = null;
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

function onFileSelect(action: FileMenuValue) {
	// the 'examples' parent has children, so the menu never selects it
	if (action === 'examples') return;
	ACTIONS_STRATEGIES[action]();
}

const EXAMPLE_PROJECTS_LEVEL: NestedMenuLevel<ExampleProjectId> = {
	items: (Object.keys(EXAMPLE_PROJECTS) as ExampleProjectId[]).map(id => ({ value: id, label: EXAMPLE_PROJECTS[id].label })),
	onSelect: onExampleSelect,
};

const FILE_MENU: NestedMenuLevel<FileMenuValue> = {
	items: [
		{ value: 'new', label: 'New Project' },
		{ value: 'import', label: 'Import Project' },
		{ value: 'export', label: 'Export Project' },
		{ value: 'results', label: 'Show Results' },
		{ value: 'examples', label: 'Example Projects', children: EXAMPLE_PROJECTS_LEVEL },
	],
	onSelect: onFileSelect,
};
</script>

<template>
	<MenuWithNestedDropDown title="File" :level="FILE_MENU" />
	<ConfirmModal v-if="isNewProjectConfirmOpen" title="New Project"
		message="Start a new project? Unsaved changes and the undo history will be lost."
		confirm-label="Create" :on-confirm="onNewProjectConfirm" :on-reject="onNewProjectReject" />
	<ConfirmModal v-if="isImportConfirmOpen" title="Import Project"
		message="Importing a project will replace the current one. Unsaved changes and the undo history will be lost."
		confirm-label="Import" :on-confirm="onImportConfirm" :on-reject="onImportReject" />
	<ConfirmModal v-if="pendingExampleId" title="Open Example Project"
		message="Opening an example will replace the current project. Unsaved changes and the undo history will be lost."
		confirm-label="Open" :on-confirm="onExampleConfirm" :on-reject="onExampleReject" />
	<SaveProjectModal v-if="isSaveProjectModalOpen" :on-confirm="onSaveProjectConfirm"
		:on-reject="onSaveProjectReject" />
</template>
