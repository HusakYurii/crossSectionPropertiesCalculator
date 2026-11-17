<script setup lang="ts">
import { computed, ref } from 'vue';
import { SHAPE_TYPES } from '../../../interfaces/beams/common.types.ts';
import type { CustomShapeGeometry } from '../../../interfaces/beams/CustomShape.types.ts';
import { NAVIGATION_HINTS } from '../../../constants/canvasInteraction.ts';
import CanvasHint from '../../middle/view/CanvasHint.vue';
import SnapControl from '../../middle/view/quickActions/snap/SnapControl.vue';
import { appSessionState } from '../../../store/appSessionState.ts';
import { getActiveSnapStep } from '../../../mathUtils/snap.ts';
import { DEFAULT_FEM_MESH_OPTIONS, type FEMMeshOptions } from '../../../interfaces/FEMMeshOptions.ts';
import { openInfoPanel } from '../../../store/infoPanel.ts';
import IsNegativeField from '../components/IsNegativeField.vue';
import ButtonField from '../components/ButtonField.vue';
import { type WatchStoreGeometryProps, useStoreGeometryWatcher } from '../composables/useStoreGeometryWatcher.ts';
import { useFemCalculation } from './composables/useFemCalculation.ts';
import { useCustomShapeCanvas } from './composables/useCustomShapeCanvas.ts';
import { pickCsvPoints } from './csv/pickCsvPoints.ts';
import { DEFAULT_CSV_FILE_NAME, exportCsvPoints } from './csv/exportCsvPoints.ts';
import CsvFileNameModal from './csv/CsvFileNameModal.vue';
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

// a shape can only be saved with results that belong to the polygon on screen
const OUTDATED_HINT = 'The shape or the mesh settings changed. Calculate again to update the results before saving.';

const canvasRef = ref<HTMLCanvasElement | null>(null);
const wrapperRef = ref<HTMLDivElement | null>(null);

const HINTS = ['Click to add a point', 'drag a point to move it', 'drag on empty canvas to select points', 'Cmd/Ctrl+click to add to the selection', ...NAVIGATION_HINTS];

const { fitView, requestRedraw } = useCustomShapeCanvas({
	canvasRef,
	wrapperRef,
	points: () => geometry.points,
	selectedIndices,
	crossSectionProperties,
	crossSectionMesh,
	isStale,
	hasResults,
	getSnapStep: () => getActiveSnapStep(appSessionState.snapping),
});

function importCsv() {
	pickCsvPoints((points) => {
		geometry.points.splice(0, geometry.points.length, ...points);
		selectedIndices.value = [];
		resetResults();
		// the imported shape can be anywhere, so look at it
		fitView();
		requestRedraw();
	});
}

const isExportModalOpen = ref(false);

function closeExportModal() {
	isExportModalOpen.value = false;
}

function onExportConfirm(name: string) {
	closeExportModal();
	exportCsvPoints(name, geometry.points);
}

function openCsvInfo() {
	openInfoPanel('whatIsCustomShapeCsvFormat');
}

function clearPoints() {
	geometry.points.splice(0, geometry.points.length);
	selectedIndices.value = [];
	resetResults();
	requestRedraw();
}

defineExpose({ geometry, crossSectionProperties, crossSectionPolygon, crossSectionMesh, isValid });
</script>

<template>
	<div class="custom-shape">
		<div class="custom-shape__canvas" ref="wrapperRef">
			<canvas ref="canvasRef"></canvas>
			<SnapControl class="custom-shape__snap" />
			<CanvasHint :items="HINTS" />
		</div>

		<aside class="custom-shape__side">
			<div class="custom-shape__options">
				<IsNegativeField v-model="geometry.isNegative" />

				<ButtonField label="CSV file" info-label="CSV file info" @info="openCsvInfo">
					<button type="button" :disabled="geometry.points.length === 0"
						@click="isExportModalOpen = true">Export</button>
					<button type="button" @click="importCsv">Import</button>
				</ButtonField>
			</div>

			<CustomShapePointsList v-model:points="geometry.points" v-model:selected-indices="selectedIndices"
				@clear="clearPoints" />

			<FemMeshSettings v-model:options="femOptions" />

			<button type="button" class="custom-shape__calculate" :disabled="!needsRecalculation"
				:title="needsRecalculation ? OUTDATED_HINT : undefined" @click="calculate">
				{{ isCalculating ? 'Calculating...' : 'Calculate with FEM' }}
			</button>
		</aside>

		<CsvFileNameModal v-if="isExportModalOpen" :initial-name="DEFAULT_CSV_FILE_NAME"
			:on-confirm="onExportConfirm" :on-reject="closeExportModal" />
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

.custom-shape__snap {
	position: absolute;
	top: 8px;
	right: 8px;
	z-index: 1;
}

.custom-shape__canvas canvas {
	display: block;
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
