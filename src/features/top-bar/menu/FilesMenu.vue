<script setup lang="ts">
import { nextTick, ref } from 'vue';
import MenuWithNestedDropDown from './components/MenuWithNestedDropDown.vue';
import ConfirmModal from '@/shared/components/modals/ConfirmModal.vue';
import SaveProjectModal from '../modals/SaveProjectModal.vue';
import { fileUploader } from '@/shared/io/FileUploader';

import { importExampleProject, importStoreData, loadProjectData } from '@/store/persistence/storeDataImporter';
import type { ImportResult } from '@/store/persistence/storeDataImporter.types';
import { EXAMPLE_PROJECTS } from '../exampleProjects';
import type { ExampleProjectId } from '../exampleProjects/index.types';
import type { NestedMenuLevel } from './menu.types';
import { EMPTY_PROJECT, exportStoreData } from '@/store/persistence/storeDataExporter';
import { store } from '@/store/store';
import { getCompositeParts } from '@/store/compositeParts';
import { history } from '@/store/history';
import { compositeCrossSectionPropertiesSolver } from '@/solvers';
import { createReportSnapshot, saveReportSnapshot } from '@/features/report';
import { toast } from 'vue3-toastify';
import { eventBus } from '@/shared/services/EventBus';

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

const IMPORT_ERRORS: Record<Exclude<ImportResult, 'ok'>, string> = {
	invalid: 'The JSON data is not valid. Probably wrong file',
	'no-file': "File wasn't picked up. Upload valid JSON file",
	'parse-error': 'Failed to parse the file, make sure it is the right one',
	'load-failed': 'Failed to load the example project',
};

/** shows the toast of an import result; true when the project was loaded */
function notifyImport(result: ImportResult): boolean {
	if (result === 'ok') {
		toast.info('Successfully imported');
		return true;
	}
	toast.error(IMPORT_ERRORS[result]);
	return false;
}

function importProject() {
	fileUploader.uploadJSON(async (file) => {
		if (notifyImport(await importStoreData(file))) emitProjectLoaded();
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
	if (notifyImport(await importExampleProject(EXAMPLE_PROJECTS[id].load))) emitProjectLoaded();
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
		const solved = compositeCrossSectionPropertiesSolver.solve(getCompositeParts(store));
		if (!solved.ok) {
			toast.error(solved.error.message);
			return;
		}
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
