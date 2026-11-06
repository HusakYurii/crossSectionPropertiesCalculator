<script setup lang="ts">
import { toast } from 'vue3-toastify';
import { computed, nextTick, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue';
import { SHAPE_TYPES } from '../../../interfaces/beams/common.types.ts';
import type { CustomShapeGeometry } from '../../../interfaces/beams/CustomShape.types.ts';
import type { CanvasSize } from '../../middle/view/canvas/Canvas.ts';
import { CanvasScene } from '../../middle/view/canvas/CanvasScene.ts';
import { CURSOR } from '../../middle/view/canvas/constants/cursors.ts';
import { NAVIGATION_HINTS } from '../../middle/view/canvas/constants/canvasHints.ts';
import CanvasHint from '../../middle/view/CanvasHint.vue';
import { DrawTargetsCollection, type DrawableTarget } from '../../middle/view/canvas/DrawTargetsCollection.ts';
import { Grid, MainAxis } from '../../middle/view/shapes/index.ts';
import type { Point } from '../../../interfaces/common/types.ts';
import { EMPTY_CROSS_SECTION_PROPERTIES, type CrossSectionProperties } from '../../../interfaces/sectionProperties/index.ts';
import { DEFAULT_FEM_MESH_OPTIONS, type FEMMeshOptions } from '../../../interfaces/FEMMeshOptions.ts';
import { store } from '../../../store/store.ts';
import { openInfoPanel } from '../../../store/infoPanel.ts';
import { convertCSVToPoints } from './customShapeFormUntils/csvTextParser.ts';
import { crossSectionPolygonsBuilder } from '../../../solvers/CrossSectionPolygonsBuilder.ts';
import { femCrossSectionPropertiesSolver } from '../../../solvers/FEMCrossSectionPropertiesSolver.ts';
import type { Triangle } from '../../../solvers/femTriangulator/triangulate.ts';
import { MeshView } from '../../middle/view/beams/index.ts';
import IsNegativeField from '../form/IsNegativeField.vue';
import ButtonField from '../form/ButtonField.vue';
import SectionField from '../form/SectionField.vue';
import { PolygonDrawTarget } from './customShapeFormDrawUtils/PolygonDrawTarget.ts';
import { PolygonEditor } from './customShapeFormDrawUtils/PolygonEditor.ts';
import { PropertyOverlays } from '../../middle/view/canvas/propertiesHelperPreviews/index.ts';
import { type WatchStoreGeometryProps, useStoreGeometryWatcher } from './composables/useStoreGeometryWatcher.ts';
import { uploadCsv } from '../../../fileLoader/uploadFile.ts';
import { FEM_OPTION_FIELDS } from './fields/shapeFields.ts';

const MIN_POINTS = 3;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 20;
// the zoom a new, empty shape starts with, so the 10 unit grid is easy to hit
const START_ZOOM = 3;
// share of the canvas an existing shape fills when it is fitted
const FIT_MARGIN = 0.8;

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
const femOptions = computed(() => geometry.femOptions as Required<FEMMeshOptions>);


// Import CSV file: the points in the file replace the ones on the canvas. Rows are x,y pairs, like the
// files the shape forms export. Values are rounded to whole numbers, as the editor keeps them, and a
// last row that repeats the first one (a closed polygon) is dropped because a shape closes itself.

function importCsv() {
	uploadCsv( async (file) => {

		if (!file) {
			toast.error("No file was attached, try again")
			return;
		}

		const result = convertCSVToPoints(await file.text(), { round: true, dropClosingPoint: true });
		if (!result.ok) {
			// nothing is replaced when the file is wrong, so the drawing the user has is never half lost
			toast.error(result.error)
			return;
		}

		geometry.points.splice(0, geometry.points.length, ...result.points);
		selectedIndex.value = null;
		resetResults();
		// the imported shape can be anywhere, so look at it
		fitViewToPoints(scene.canvas.canvasSize);
		requestRedraw();
	});
}

function openCsvInfo() {
	openInfoPanel('whatIsCustomShapeCsvFormat');
}

function resetFemOptions() {
	geometry.femOptions = { ...DEFAULT_FEM_MESH_OPTIONS };
}

const selectedIndex = ref<number | null>(null);

const stored = props.selectedShapeUID ? store.crossSectionProperties[props.selectedShapeUID] : undefined;
const storedPolygon = props.selectedShapeUID ? store.crossSectionPolygon[props.selectedShapeUID] : undefined;
const crossSectionProperties = ref<CrossSectionProperties>(
	stored ? { ...stored } : { ...EMPTY_CROSS_SECTION_PROPERTIES }
);
const crossSectionPolygon = ref<Point[]>(storedPolygon ? storedPolygon.map(({ x, y }) => ({ x, y })) : []);
const storedMesh = props.selectedShapeUID ? store.crossSectionMesh[props.selectedShapeUID] : undefined;
const crossSectionMesh = shallowRef<Triangle[]>(storedMesh ?? []);
const isStale = ref(!stored);
const isCalculating = ref(false);

const hasEnoughPoints = computed(() => geometry.points.length >= MIN_POINTS);
// a shape can only be saved with results that belong to the polygon on screen
const OUTDATED_HINT = 'The shape or the mesh settings changed. Calculate again to update the results before saving.';
// the button is only active while there is something to calculate: enough points, and results that
// do not belong to the polygon on screen (yet, or any more)
const needsRecalculation = computed(() => hasEnoughPoints.value && isStale.value && !isCalculating.value);
const isValid = computed(() => hasEnoughPoints.value && !isStale.value && !isCalculating.value);

const canvasRef = ref<HTMLCanvasElement | null>(null);
const wrapperRef = ref<HTMLDivElement | null>(null);

const HINTS = ['Click to add a point', 'drag a point to move it', ...NAVIGATION_HINTS];

let scene: CanvasScene;
// the view is fitted to an existing shape once, the first time the canvas has a size
let hasFitted = false;

let gridTargets: DrawTargetsCollection<Grid>;
let axisTargets: DrawTargetsCollection<MainAxis>;
let meshTargets: DrawTargetsCollection<MeshView>;
let polygonTargets: DrawTargetsCollection<PolygonDrawTarget>;
let overlayTargets: DrawTargetsCollection<DrawableTarget>;

// The polygon is drawn where the points are, so the centroid is not the world origin and every overlay is
// centered on it. The shape is never rotated, so its own axes are the world axes.
const overlays = new PropertyOverlays({ drawCentroid: true });
// overlays only mean something for results that belong to the polygon on screen, like the mesh
const hasResults = computed(() => !isStale.value && crossSectionProperties.value.A > 0);

function syncOverlays() {
	const { centroid_x, centroid_y } = crossSectionProperties.value;
	overlays.update({ properties: crossSectionProperties.value, center: { x: centroid_x, y: centroid_y } });
}

const redraw = () => {
	gridTargets.draw();
	axisTargets.draw();
	// the mesh belongs to the polygon it was calculated from, so it is hidden once that has changed
	if (!isStale.value) {
		meshTargets.draw();
	}
	polygonTargets.draw();
	// over the shape, like in the shape preview, so the centroid and the axes stay visible
	if (hasResults.value) {
		overlayTargets.draw();
	}
};

const requestRedraw = () => scene.requestRedraw();

/**
 * Zooms and pans so the drawn points fill the canvas, like the shape preview does. It is meant for
 * a shape that is opened for editing; a new shape has no points and keeps the start view.
 */
function fitViewToPoints(size: CanvasSize) {
	const points = geometry.points;
	if (points.length === 0 || !size.displayWidth || !size.displayHeight) {
		return;
	}

	let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
	for (const { x, y } of points) {
		minX = Math.min(minX, x);
		minY = Math.min(minY, y);
		maxX = Math.max(maxX, x);
		maxY = Math.max(maxY, y);
	}

	const width = maxX - minX;
	const height = maxY - minY;
	const cx = minX + width / 2;
	const cy = minY + height / 2;

	// a single point (or points on one spot) has no size to fit, so it is only centered
	const fitted = width > 0 || height > 0
		? Math.min(
			width > 0 ? size.displayWidth / width : Infinity,
			height > 0 ? size.displayHeight / height : Infinity,
		) * FIT_MARGIN
		: START_ZOOM;
	const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, fitted));

	const view = scene.transformService.transforms;
	view.zoom = zoom;
	// same mapping the shape preview uses: the shape's center goes to the canvas center, y is flipped
	view.panX = -cx * zoom;
	view.panY = cy * zoom;
}

const onResize = (size: CanvasSize) => {
	if (!hasFitted && size.displayWidth && size.displayHeight) {
		hasFitted = true;
		fitViewToPoints(size);
	}
};

// points are edited both from the canvas and from the list, so any change must repaint
watch(() => geometry.points, requestRedraw, { deep: true });
// results are only valid for the polygon and FEM settings they were calculated from (isNegative does not change them)
watch(() => [geometry.points, geometry.femOptions], () => { isStale.value = true; }, { deep: true });

/** the polygon is never rotated, so the mesh lies on the drawn points as the solver returned it */
function showMesh(triangles: Triangle[]) {
	meshTargets.cleanUp();
	meshTargets.add(new MeshView(triangles));
}

async function calculateWithFem() {
	if (!hasEnoughPoints.value || isCalculating.value) {
		return;
	}

	isCalculating.value = true;
	// let the "Calculating..." state paint before the solver blocks the thread
	await nextTick();
	await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

	try {
		const polygon = crossSectionPolygonsBuilder.calculate(geometry);
		// solve (not calculate) so the mesh the numbers come from can be drawn too
		const { properties, triangles } = femCrossSectionPropertiesSolver.solve(polygon, geometry.femOptions);
		crossSectionProperties.value = properties;
		crossSectionPolygon.value = polygon;
		crossSectionMesh.value = triangles;
		showMesh(triangles);
		isStale.value = false;
		requestRedraw();
	} catch (error) {
		const message = error instanceof Error ? error.message : 'The FEM solver failed.';
		toast.error(message)

	} finally {
		isCalculating.value = false;
	}
}
watch(selectedIndex, requestRedraw);
watch(isStale, requestRedraw);
// results are replaced as a whole when they are calculated, imported or cleared
watch(crossSectionProperties, () => {
	syncOverlays();
	requestRedraw();
});

/** typed values are rounded to whole numbers once the user commits them (blur / Enter) */
function setCoordinate(point: Point, axis: 'x' | 'y', event: Event) {
	const input = event.target as HTMLInputElement;
	// `|| 0` covers an empty or invalid field and turns -0 into 0
	point[axis] = Math.round(Number(input.value)) || 0;
	// show the rounded value even when it equals the old one, so the field never keeps "2.7"
	input.value = String(point[axis]);
}

/** swaps a point with its neighbour (-1 up, +1 down); the selection follows the moved point */
function movePoint(index: number, delta: -1 | 1) {
	const target = index + delta;
	const points = geometry.points;
	if (target < 0 || target >= points.length) {
		return;
	}

	[points[index], points[target]] = [points[target], points[index]];

	if (selectedIndex.value === index) {
		selectedIndex.value = target;
	} else if (selectedIndex.value === target) {
		selectedIndex.value = index;
	}
}

function removePoint(index: number) {
	geometry.points.splice(index, 1);
	if (selectedIndex.value === index) {
		selectedIndex.value = null;
	} else if (selectedIndex.value !== null && selectedIndex.value > index) {
		selectedIndex.value -= 1;
	}
}

/** the results belong to the points they were calculated from, so a new set of points leaves none behind */
function resetResults() {
	crossSectionProperties.value = { ...EMPTY_CROSS_SECTION_PROPERTIES };
	crossSectionPolygon.value = [];
	crossSectionMesh.value = [];
	meshTargets.cleanUp();
	isStale.value = true;
}

function clearPoints() {
	geometry.points.splice(0, geometry.points.length);
	selectedIndex.value = null;
	resetResults();
	requestRedraw();
}

onMounted(() => {
	const canvasEl = canvasRef.value!;

	scene = new CanvasScene({
		canvasEl,
		wrapper: wrapperRef.value!,
		minSize: { width: 100, height: 100 },
		minZoom: MIN_ZOOM,
		maxZoom: MAX_ZOOM,
		startZoom: START_ZOOM,
		draw: redraw,
		onResize,
	});
	canvasEl.style.cursor = CURSOR.CROSSHAIR;

	const context = scene.context;
	gridTargets = new DrawTargetsCollection<Grid>({ context });
	gridTargets.add(new Grid());
	axisTargets = new DrawTargetsCollection<MainAxis>({ context });
	axisTargets.add(new MainAxis());
	meshTargets = new DrawTargetsCollection<MeshView>({ context });
	// a shape that was calculated before shows its saved mesh again right away
	if (crossSectionMesh.value.length > 0) {
		showMesh(crossSectionMesh.value);
	}
	polygonTargets = new DrawTargetsCollection<PolygonDrawTarget>({ context });
	polygonTargets.add(new PolygonDrawTarget(() => geometry.points, () => selectedIndex.value));
	overlayTargets = new DrawTargetsCollection<DrawableTarget>({ context });
	overlayTargets.add(...overlays.targets);
	// a shape that was calculated before shows its saved results again right away
	syncOverlays();

	scene.addService(new PolygonEditor({
		canvas: canvasEl,
		inputService: scene.inputService,
		transformService: scene.transformService,
		getPoints: () => geometry.points,
		getSelectedIndex: () => selectedIndex.value,
		setSelectedIndex: (index) => { selectedIndex.value = index; },
		onChange: requestRedraw,
	}));

	scene.initialize();
});

onUnmounted(() => {
	scene?.deactivate();
});

defineExpose({ geometry, crossSectionProperties, crossSectionPolygon, crossSectionMesh, isValid });
</script>

<template>
	<div class="custom-shape">
		<div class="custom-shape__canvas" ref="wrapperRef">
			<canvas ref="canvasRef"></canvas>
			<CanvasHint :items="HINTS" />
		</div>

		<aside class="custom-shape__side">
			<div class="custom-shape__options">
				<IsNegativeField v-model="geometry.isNegative" />

				<ButtonField label="CSV file" button-text="Import" info-label="CSV import info" @click="importCsv"
					@info="openCsvInfo" />
			</div>

			<div class="custom-shape__list-header">
				<span v-if="geometry.points.length === 0" class="custom-shape__list-empty">
					No points yet. Click on the canvas to add the first one.
				</span>
				<span v-else>Points: {{ geometry.points.length }}</span>
				<button type="button" class="custom-shape__clear" :disabled="geometry.points.length === 0"
					@click="clearPoints">Clear</button>
			</div>

			<p v-if="geometry.points.length > 0 && !hasEnoughPoints" class="custom-shape__empty">
				A shape needs at least {{ MIN_POINTS }} points.
			</p>

			<ol class="custom-shape__list">
				<li v-for="(point, index) in geometry.points" :key="index" class="custom-shape__row"
					:class="{ 'custom-shape__row--selected': index === selectedIndex }" @click="selectedIndex = index">
					<span class="custom-shape__index">{{ index + 1 }}</span>
					<label class="custom-shape__coord">
						<span>x</span>
						<input :value="point.x" type="number" step="1" @focus="selectedIndex = index"
							@change="setCoordinate(point, 'x', $event)" />
					</label>
					<label class="custom-shape__coord">
						<span>y</span>
						<input :value="point.y" type="number" step="1" @focus="selectedIndex = index"
							@change="setCoordinate(point, 'y', $event)" />
					</label>
					<span class="custom-shape__move">
						<button type="button" class="custom-shape__move-btn" aria-label="Move point up"
							:disabled="index === 0" @click.stop="movePoint(index, -1)">▲</button>
						<button type="button" class="custom-shape__move-btn" aria-label="Move point down"
							:disabled="index === geometry.points.length - 1"
							@click.stop="movePoint(index, 1)">▼</button>
					</span>
					<button type="button" class="custom-shape__remove" aria-label="Remove point"
						@click.stop="removePoint(index)">✕</button>
				</li>
			</ol>

			<details class="custom-shape__mesh">
				<summary>Mesh settings</summary>
				<div class="custom-shape__mesh-fields">
					<SectionField v-for="field in FEM_OPTION_FIELDS" :key="field.key" v-model="femOptions[field.key]" :label="field.label" :unit="field.unit" />
				</div>
				<div class="custom-shape__mesh-actions">
					<button type="button" class="custom-shape__clear" @click="resetFemOptions">Reset</button>
				</div>
			</details>

			<button type="button" class="custom-shape__calculate" :disabled="!needsRecalculation"
				:title="needsRecalculation ? OUTDATED_HINT : undefined" @click="calculateWithFem">
				{{ isCalculating ? 'Calculating...' : 'Calculate with FEM' }}
			</button>
		</aside>
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

.custom-shape__list-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
	/* room for the two-line "No points yet" hint, so the header (and the Clear button) never changes size */
	height: 30px;
	flex-shrink: 0;
	font-size: 10.8px;
	font-weight: 700;
	letter-spacing: 0.04em;
	text-transform: uppercase;
	opacity: 0.8;
}

/* the sentence is a hint, not a label, so it drops the uppercase and gets the same quiet look as the other hints */
.custom-shape__list-empty {
	font-size: 11px;
	font-weight: 400;
	letter-spacing: normal;
	text-transform: none;
	line-height: 1.3;
	opacity: 0.75;
}

.custom-shape__clear {
	flex-shrink: 0;
	padding: 2px 8px;
	border: none;
	border-radius: 5px;
	background: var(--color-fill);
	color: var(--color-text);
	font-size: 10.8px;
	cursor: pointer;
}

.custom-shape__clear:disabled {
	opacity: 0.4;
	cursor: not-allowed;
}

.custom-shape__list {
	flex: 1;
	min-height: 0;
	margin: 0;
	padding: 0;
	overflow-y: auto;
	list-style: none;
}

.custom-shape__row {
	display: grid;
	grid-template-columns: 22px 1fr 1fr 14px 20px;
	align-items: center;
	gap: 6px;
	padding: 3px 4px;
	border-radius: 5px;
	cursor: pointer;
}

.custom-shape__row--selected {
	background: var(--color-point-selected);
}

.custom-shape__index {
	font-size: 11px;
	font-weight: 700;
	opacity: 0.7;
	text-align: center;
}

.custom-shape__coord {
	display: flex;
	align-items: center;
	min-width: 0;
	gap: 4px;
	padding: 0 6px;
	border: 1px solid var(--color-border-subtle);
	border-radius: 5px;
	background: var(--color-surface-canvas);
	font-size: 10.8px;
}

.custom-shape__coord input {
	flex: 1;
	min-width: 0;
	height: 24px;
	border: none;
	background: transparent;
	font-size: 11.7px;
	color: var(--color-text);
	outline: none;
}

.custom-shape__move {
	display: flex;
	flex-direction: column;
	gap: 1px;
}

.custom-shape__move-btn {
	width: 14px;
	height: 11px;
	padding: 0;
	border: none;
	border-radius: 3px;
	background: var(--color-fill);
	color: var(--color-text);
	font-size: 6px;
	line-height: 1;
	cursor: pointer;
}

.custom-shape__move-btn:hover:not(:disabled) {
	background: var(--color-fill-strong);
}

.custom-shape__move-btn:disabled {
	opacity: 0.25;
	cursor: default;
}

.custom-shape__remove {
	width: 18px;
	height: 18px;
	padding: 0;
	border: none;
	border-radius: 50%;
	background: var(--color-fill);
	color: var(--color-text);
	font-size: 9px;
	line-height: 1;
	cursor: pointer;
}

.custom-shape__remove:hover {
	background: var(--color-fill-hover);
}

.custom-shape__mesh {
	font-size: 10.8px;
}

.custom-shape__mesh summary {
	font-weight: 700;
	letter-spacing: 0.04em;
	text-transform: uppercase;
	opacity: 0.8;
	cursor: pointer;
	user-select: none;
}

.custom-shape__mesh-actions {
	display: flex;
	justify-content: flex-end;
}

.custom-shape__mesh-fields {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 8px;
	margin: 8px 0;
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

.custom-shape__empty {
	margin: 0;
	font-size: 11px;
	opacity: 0.6;
}
</style>
