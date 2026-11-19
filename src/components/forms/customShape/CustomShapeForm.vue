<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { SHAPE_TYPES } from '../../../interfaces/beams/common.types.ts';
import type { CustomShapeGeometry } from '../../../interfaces/beams/CustomShape.types.ts';
import type { Point } from '../../../interfaces/common/types.ts';
import SnapControl from '../../middle/view/quickActions/snap/SnapControl.vue';
import QuickActionsBar from '../../middle/view/quickActions/QuickActionsBar.vue';
import QuickActionsDivider from '../../middle/view/quickActions/QuickActionsDivider.vue';
import ViewQuickActions from '../../middle/view/quickActions/ViewQuickActions.vue';
import HistoryQuickActions from '../../middle/view/quickActions/HistoryQuickActions.vue';
import { appSessionState } from '../../../store/appSessionState.ts';
import { infoPanelState } from '../../../store/infoPanel.ts';
import { getActiveSnapStep } from '../../../mathUtils/snap.ts';
import { DEFAULT_FEM_MESH_OPTIONS, type FEMMeshOptions } from '../../../interfaces/FEMMeshOptions.ts';
import IsNegativeField from '../components/IsNegativeField.vue';
import ButtonField from '../components/ButtonField.vue';
import { type WatchStoreGeometryProps, useStoreGeometryWatcher } from '../composables/useStoreGeometryWatcher.ts';
import { useLocalHistory } from '../../../composables/useLocalHistory.ts';
import { useUndoRedoShortcuts } from '../../../composables/useUndoRedoShortcuts.ts';
import { useFemCalculation } from './composables/useFemCalculation.ts';
import { useCustomShapeCanvas } from './composables/useCustomShapeCanvas.ts';
import { useCustomShapeCsv } from './composables/useCustomShapeCsv.ts';
import SaveCustomShapeCSVFileModal from './csv/SaveCustomShapeCSVFileModal.vue';
import CustomShapePointsList from './CustomShapePointsList.vue';
import FemMeshSettings from './FemMeshSettings.vue';

// the form starts empty: the user draws the polygon
const getDefault = (): CustomShapeGeometry => ({
	isNegative: false,
	rotation: 0,
	type: SHAPE_TYPES.CUSTOM_SHAPE,
	points: [],
	femOptions: { ...DEFAULT_FEM_MESH_OPTIONS },
});

const props = defineProps<WatchStoreGeometryProps>();
const { geometry } = useStoreGeometryWatcher(props, getDefault);

// The points are the shape, so there is nothing to rotate. The field is gone, so a rotation left over
// from before (it is applied by the polygon strategy) is cleared rather than applied where nobody can see it.
geometry.rotation = 0;

// a shape saved before the FEM settings existed has none, so it gets the defaults to edit
if (!geometry.femOptions) {
	geometry.femOptions = { ...DEFAULT_FEM_MESH_OPTIONS };
}
const femOptions = computed({
	get: () => geometry.femOptions as Required<FEMMeshOptions>,
	set: (value) => { geometry.femOptions = value; },
});

const selectedIndices = ref<number[]>([]);

const {
	crossSectionProperties,
	crossSectionPolygon,
	crossSectionMesh,
	isStale,
	isCalculating,
	needsRecalculation,
	isValid,
	hasResults,
	calculate,
	resetResults,
} = useFemCalculation(geometry, props.selectedShapeUID);

// Created after the normalisation above, so the opening state is the base. useStoreGeometryWatcher fills the
// geometry synchronously during setup (immediate watch); the uid never changes while the form lives (if it ever did, the history would need a reset).
// isPointerDown and isExportModalOpen come from the composables below, hence the arrow functions.
const localHistory = useLocalHistory({
	source: () => ({ points: geometry.points, isNegative: geometry.isNegative, femOptions: geometry.femOptions }),
	restore: (snapshot) => {
		geometry.points.splice(0, geometry.points.length, ...snapshot.points);
		geometry.isNegative = snapshot.isNegative;
		geometry.femOptions = snapshot.femOptions;
		// indices may point at other points after undoing a reorder / delete
		selectedIndices.value = [];
	},
	isBlocked: () => isPointerDown() || isExportModalOpen.value || infoPanelState.topic !== null,
});
useUndoRedoShortcuts({ undo: localHistory.undo, redo: localHistory.redo, capture: true });

/** the points are swapped as a whole, so the selection and the results of the old ones go too */
function replacePoints(points: Point[]) {
	geometry.points.splice(0, geometry.points.length, ...points);
	selectedIndices.value = [];
	resetResults();
	localHistory.commit();
}

// IsNegativeField is shared by many forms, so the history hook lives here and not in the field
function setSign(isNegative: boolean) {
	geometry.isNegative = isNegative;
	localHistory.commit();
}

// a shape can only be saved with results that belong to the polygon on screen
const OUTDATED_HINT = 'The shape or the mesh settings changed. Calculate again to update the results before saving.';

const canvasRef = ref<HTMLCanvasElement | null>(null);
const wrapperRef = ref<HTMLDivElement | null>(null);

const { fitView, requestRedraw, viewActions, isPointerDown } = useCustomShapeCanvas({
	canvasRef,
	wrapperRef,
	points: () => geometry.points,
	selectedIndices,
	crossSectionProperties,
	crossSectionMesh,
	isStale,
	hasResults,
	getSnapStep: () => getActiveSnapStep(appSessionState.snapping),
	onEditEnd: localHistory.commit,
});

const {
	defaultFileName,
	isExportModalOpen,
	canExport,
	openExportModal,
	closeExportModal,
	confirmExport,
	importCsv,
	openCsvInfo,
} = useCustomShapeCsv({
	points: () => geometry.points,
	// the imported shape can be anywhere, so look at it
	onImport: (points) => {
		replacePoints(points);
		fitView();
	},
});

function clearPoints() {
	replacePoints([]);
	requestRedraw();
}

const pointsListRef = ref<HTMLDivElement | null>(null);

// A press anywhere else clears the selection. The canvas (with its quick actions bar) and the points list are
// left out: the list rows are the other way to select points, so pressing them must not undo the selection.
// pointerdown, not click: the selection goes the moment the press starts, before any click handler runs.
function onDocumentPointerDown(event: PointerEvent) {
	const target = event.target;
	if (!(target instanceof Node) || selectedIndices.value.length === 0) {
		return;
	}
	if (wrapperRef.value?.contains(target) || pointsListRef.value?.contains(target)) {
		return;
	}
	selectedIndices.value = [];
}

onMounted(() => document.addEventListener('pointerdown', onDocumentPointerDown, true));
onUnmounted(() => document.removeEventListener('pointerdown', onDocumentPointerDown, true));

defineExpose({ geometry, crossSectionProperties, crossSectionPolygon, crossSectionMesh, isValid });
</script>

<template>
	<div class="custom-shape">
		<div class="custom-shape__canvas" ref="wrapperRef">
			<canvas ref="canvasRef"></canvas>
			<QuickActionsBar align="right">
				<HistoryQuickActions :can-undo="localHistory.canUndo.value" :can-redo="localHistory.canRedo.value"
					@undo="localHistory.undo" @redo="localHistory.redo" />
				<QuickActionsDivider />
				<ViewQuickActions :actions="viewActions" />
				<QuickActionsDivider />
				<SnapControl />
			</QuickActionsBar>
		</div>

		<aside class="custom-shape__side">
			<div class="custom-shape__options">
				<IsNegativeField :model-value="geometry.isNegative" @update:model-value="setSign" />

				<ButtonField label="CSV file" info-label="CSV file info" @info="openCsvInfo">
					<button type="button" :disabled="!canExport"
						@click="openExportModal">Export</button>
					<button type="button" @click="importCsv">Import</button>
				</ButtonField>
			</div>

			<div ref="pointsListRef" class="custom-shape__points">
				<CustomShapePointsList v-model:points="geometry.points" v-model:selected-indices="selectedIndices"
					@clear="clearPoints" @edit="localHistory.commit" />
			</div>

			<FemMeshSettings v-model:options="femOptions" @edit="localHistory.commit" />

			<button type="button" class="custom-shape__calculate" :disabled="!needsRecalculation"
				:title="needsRecalculation ? OUTDATED_HINT : undefined" @click="calculate">
				{{ isCalculating ? 'Calculating...' : 'Calculate with FEM' }}
			</button>
		</aside>

		<SaveCustomShapeCSVFileModal v-if="isExportModalOpen" :initial-name="defaultFileName"
			:on-confirm="confirmExport" :on-reject="closeExportModal" />
	</div>
</template>

<style scoped>
.custom-shape {
	display: grid;
	grid-template-columns: minmax(0, 1fr) 280px;
	gap: 20px;
	height: 100%;
	min-height: 224px;
}

.custom-shape__canvas {
	position: relative;
	min-width: 0;
	min-height: 0;
	overflow: hidden;
	background: var(--color-surface-canvas);
	border: 1px solid var(--color-border-subtle);
	border-radius: 8px;
}

.custom-shape__canvas canvas {
	display: block;
}

/* the wrapper only exists to find the list in the DOM; the list keeps laying out in the side column */
.custom-shape__points {
	display: contents;
}

.custom-shape__side {
	display: flex;
	flex-direction: column;
	min-height: 0;
	gap: 8px;
	color: var(--color-text);
}

/* shape sign on the left, the import field on the right; same structure, so label, box and "?" line up */
.custom-shape__options {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 10px;
}

.custom-shape__calculate {
	height: 28px;
	border: none;
	border-radius: 6px;
	background: var(--color-text);
	color: var(--color-surface-chrome);
	font-size: 12px;
	cursor: pointer;
}

/* gray and dead when there is no data or the results are up to date, so the solver cannot be re-run by tapping */
.custom-shape__calculate:disabled {
	background: var(--color-fill-disabled);
	color: var(--color-text);
	opacity: 0.6;
	cursor: default;
}
</style>
