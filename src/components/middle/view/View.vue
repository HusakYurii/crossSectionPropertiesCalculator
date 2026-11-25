<script setup lang="ts">
import { onMounted, onUnmounted, ref, toRaw, watch } from 'vue';
import {
	ShapesInteractionService,
	DimensionsWithTextLabelInteractionService,
	ObjectSnapInteractionService,
} from './services';

import { BeamsDrawTargetCollection } from './canvas/BeamsDrawTargetCollection.ts';
import { DrawTargetsCollection } from './canvas/DrawTargetsCollection.ts';
import { CanvasScene } from './canvas/CanvasScene';
import QuickActionsBar from './quickActions/QuickActionsBar.vue';
import QuickActionsDivider from './quickActions/QuickActionsDivider.vue';
import ViewQuickActions from './quickActions/ViewQuickActions.vue';
import HatchingToggle from './quickActions/HatchingToggle.vue';
import SnapControl from './quickActions/snap/SnapControl.vue';
import { createCanvasViewActions } from './quickActions/canvasViewActions';
import QuickSolverActions from './quickActions/QuickSolverActions.vue';
import ObjectSnapActions from './quickActions/ObjectSnapActions.vue';
import { DimensionsWithTextLabel } from './canvas/annotations/DimensionsWithTextLabel.ts';
import { ShapeDimensionSource } from './canvas/annotations/dimensionSources/ShapeDimensionSource';
import { CompositeSectionOverlays } from './canvas/compositeSection/CompositeSectionOverlays.ts';
import { unionBoundingBoxes } from './canvas/drawUtils.ts';
import { getShapeVertexOffsets } from './canvas/objectSnap/shapeVertices';
import { drawObjectSnapMarkers } from './canvas/objectSnap/ObjectSnapMarkers';
import { getActiveSnapStep } from '../../../mathUtils/snap.ts';
import { AXIS_STYLE, CANVAS_FONT } from '../../../constants/canvasStyle.ts';
import { MAIN_VIEW_FIT } from '../../../constants/canvasFit.ts';

import { Grid, MainAxis, ScaleBar } from './shapes';
import { store, updateGeometryExtraData } from '../../../store/store';
import type { Point } from '../../../interfaces/common/types';
import { appSessionState, setSelectedShapeID } from '../../../store/appSessionState';
import { createBeamView } from './beams';
import { history } from '../../../store/history';
import { eventBus } from '../../../services/singletons/EventBus';
import { useDimensionsWithTextLabelEdit, EDITOR_MIN_WIDTH } from './composables/useDimensionsWithTextLabelEdit';
import { useQuickSolverOverlays } from './composables/useQuickSolverOverlays';

let scene: CanvasScene;
let gridDrawTargets: DrawTargetsCollection<Grid>;
let axisDrawTargets: DrawTargetsCollection<MainAxis>;
let scaleBarDrawTargets: DrawTargetsCollection<ScaleBar>;
let beamsDrawTargets: BeamsDrawTargetCollection;
let arrowLabelDrawTargets: DrawTargetsCollection<DimensionsWithTextLabel>;
// labels of the whole section (the centroid coordinates). They must never go into arrowLabelDrawTargets: its
// redrawId watcher below deletes the labels whose uid is not a shape. Being in this collection is what makes them visible.
let compositeLabelDrawTargets: DrawTargetsCollection<DimensionsWithTextLabel>;
let compositeOverlays: CompositeSectionOverlays;
let shapesInteractionService: ShapesInteractionService;
let dimensionsWithTextLabelInteractionService: DimensionsWithTextLabelInteractionService;
let objectSnapService: ObjectSnapInteractionService;

// the points of each shape relative to its centroid; cleared whenever the store changes
const vertexOffsetCache = new Map<string, Point[]>();
const getVertexOffsets = (uid: string) => {
	let offsets = vertexOffsetCache.get(uid);
	if (!offsets) {
		offsets = getShapeVertexOffsets(store, uid);
		vertexOffsetCache.set(uid, offsets);
	}
	return offsets;
};

const fitToScreen = () => {
	const beamBounds = unionBoundingBoxes(beamsDrawTargets.getTargets().map(beam => beam.boundingBox));
	const allBounds = unionBoundingBoxes([
		beamBounds,
		...arrowLabelDrawTargets.getTargets().map(label => label.boundingBox),
		...compositeLabelDrawTargets.getTargets().map(label => label.boundingBox),
	]);
	// the dimension lines reach back to the world axes, so a shape far out may not fit together with them: then the shape wins
	const bounds = allBounds && scene.transformService.canFit(allBounds, MAIN_VIEW_FIT.MARGIN) ? allBounds : beamBounds;
	if (bounds) {
		scene.transformService.fitToBounds(bounds, MAIN_VIEW_FIT.MARGIN);
	}
};

// set when a project was loaded, the fit runs after the first frame that draws it
let pendingFit = false;
let unsubscribeProjectLoaded: (() => void) | null = null;

const viewActions = createCanvasViewActions(() => scene, fitToScreen);

// remembers which geometry type each beam on the canvas was built for, to notice when a shape changes kind
const beamTypes = new Map<string, string>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const canvasWrapperRef = ref<HTMLDivElement | null>(null);

const requestRedraw = () => scene.requestRedraw();

// every label that can be grabbed; the composite ones are last, so they are drawn last and win the hit test
const getAllLabels = () => [...arrowLabelDrawTargets.getTargets(), ...compositeLabelDrawTargets.getTargets()];

const quickSolver = useQuickSolverOverlays();

const labelEditor = useDimensionsWithTextLabelEdit({
	worldToScreen: (point) => scene.transformService.worldToScreen(point),
	getCanvas: () => canvasRef.value,
});
const { editing, editText, editorPosition, onEditorKeyDown, onEditorWheel } = labelEditor;

const redraw = (context: CanvasRenderingContext2D) => {
	//@TODO think how to refactor it and clear canvas only at shape hit boxes 
	// and redraw them there to gain more performance
	const selectedShapeID = appSessionState.currentSelectedShapeID || '';
	const hoveredShapeID = appSessionState.currentHoveredShapeID || '';
	gridDrawTargets.draw(context);
	axisDrawTargets.draw(context);
	beamsDrawTargets.draw(
		shapesInteractionService.getHitsForShapes(
			beamsDrawTargets.getTargets(),
			shapesInteractionService.mouseWorldPosition
		),
		{
			selectedShapeID,
			hoveredShapeID
		},
		{ showHatching: appSessionState.showHatching }
	);

	compositeOverlays.draw({ context });
	const snapModel = objectSnapService.getMarkerModel();
	snapModel && drawObjectSnapMarkers(context, snapModel);
	arrowLabelDrawTargets.draw(context);
	compositeLabelDrawTargets.draw(context);
	// last, so nothing covers it
	scaleBarDrawTargets.draw(context);
	labelEditor.updateEditorPosition();
	if (pendingFit) {
		pendingFit = false;
		// the beam bounding boxes are cached during draw, so the fit waits for the first frame of the loaded project
		// fitToBounds asks for the next frame itself
		fitToScreen();
	}
};

watch(() => appSessionState.redrawId, () => {
	vertexOffsetCache.clear();
	const currentBeamIds = new Set(beamsDrawTargets.getTargets().map(val => val.uid));
	const allGeometryIds = new Set(Object.keys(store.geometry));
	const toAdd: Set<string> = new Set();
	const toDelete: Set<string> = new Set();

	currentBeamIds.forEach(uid => {
		if (!allGeometryIds.has(uid)) {
			toDelete.add(uid);
		}
	});

	// a shape that was edited into another kind (a hollow tube made solid) needs another beam class,
	// so its beam is thrown away and built again below
	currentBeamIds.forEach(uid => {
		if (allGeometryIds.has(uid) && beamTypes.get(uid) !== store.geometry[uid]?.type) {
			toDelete.add(uid);
			currentBeamIds.delete(uid);
		}
	});

	toDelete.forEach(uid => {
		beamsDrawTargets.delete(uid);
		beamTypes.delete(uid);
	});

	allGeometryIds.forEach(uid => {
		if (!currentBeamIds.has(uid)) {
			toAdd.add(uid);
		}
	});

	toAdd.forEach(uid => {
		const geometryData = store.geometry[uid];

		if (!geometryData) {
			return;
		}

		const beam = createBeamView(uid, store);
		beamsDrawTargets.add(beam);
		beamTypes.set(uid, geometryData.type);
	});

	// the list and the z-order follow the order of the keys in the store (undoing a delete puts a shape back in its place)
	beamsDrawTargets.sortBy(Object.keys(store.geometry));

	requestRedraw();
});

watch(() => appSessionState.redrawId, () => {
	const currentLabelShapeIds = new Set(arrowLabelDrawTargets.getTargets().map(val => val.sourceId));
	const allGeometryIds = new Set(Object.keys(store.geometryExtra));
	const toAdd: Set<string> = new Set();
	const toDelete: Set<string> = new Set();

	currentLabelShapeIds.forEach(uid => {
		if (!allGeometryIds.has(uid)) {
			toDelete.add(uid);
		}
	});

	allGeometryIds.forEach(uid => {
		if (!currentLabelShapeIds.has(uid)) {
			toAdd.add(uid);
		}
	});

	// the labels of a shape are registered as `${uid}_x` and `${uid}_y`, so those are the uids to remove
	toDelete.forEach(uid => {
		arrowLabelDrawTargets.delete(`${uid}_x`);
		arrowLabelDrawTargets.delete(`${uid}_y`);
	});

	toAdd.forEach(uid => {
		arrowLabelDrawTargets.add(
			new DimensionsWithTextLabel({ uid: `${uid}_x`, axis: 'x', source: new ShapeDimensionSource(uid, store, appSessionState), color: AXIS_STYLE.COLORS.x }),
			new DimensionsWithTextLabel({ uid: `${uid}_y`, axis: 'y', source: new ShapeDimensionSource(uid, store, appSessionState), color: AXIS_STYLE.COLORS.y }),
		);
	});

	requestRedraw();
});

const syncCompositeOverlays = () => {
	compositeOverlays.update(quickSolver.properties.value, quickSolver.toggles);
	// a label that is hidden while hovered must not stay bold
	const shownLabels = new Set(compositeOverlays.labels);
	compositeLabelDrawTargets.getTargets().forEach(label => !shownLabels.has(label) && label.setHighlighted(false));
	compositeLabelDrawTargets.cleanUp();
	compositeLabelDrawTargets.add(...compositeOverlays.labels);
	requestRedraw();
};

watch([quickSolver.properties, () => ({ ...quickSolver.toggles })], syncCompositeOverlays);

watch(() => appSessionState.snapOptionsToggles.endpoint, (on) => {
	!on && objectSnapService?.clearSelection();
	requestRedraw();
});

watch(() => [
	appSessionState.currentSelectedShapeID,
	appSessionState.currentHoveredShapeID
], () => {
	requestRedraw();
});

onMounted(() => {
	scene = new CanvasScene({
		canvasEl: canvasRef.value!,
		wrapper: canvasWrapperRef.value!,
		minSize: { width: 800, height: 800 },
		minZoom: 0.3,
		// 20 makes the 1 mm grid cells 10-20 px wide
		maxZoom: 20,
		draw: redraw,
	});
	const { context, inputService, transformService } = scene;

	beamsDrawTargets = new BeamsDrawTargetCollection({ context });
	gridDrawTargets = new DrawTargetsCollection<Grid>({ context });
	axisDrawTargets = new DrawTargetsCollection<MainAxis>({ context });
	scaleBarDrawTargets = new DrawTargetsCollection<ScaleBar>({ context });
	arrowLabelDrawTargets = new DrawTargetsCollection<DimensionsWithTextLabel>({ context });
	compositeLabelDrawTargets = new DrawTargetsCollection<DimensionsWithTextLabel>({ context });
	compositeOverlays = new CompositeSectionOverlays();

	gridDrawTargets.add(new Grid());
	scaleBarDrawTargets.add(new ScaleBar());
	axisDrawTargets.add(new MainAxis({ showLabels: true, labelFontSize: CANVAS_FONT.LABEL_SIZE, labelTopReserve: AXIS_STYLE.LABEL_TOP_RESERVE }));

	shapesInteractionService = new ShapesInteractionService({
		canvas: canvasRef.value!,
		drawTargets: beamsDrawTargets,
		inputService,
		screenToWorld: (point) => transformService.screenToWorld(point),
		isTransformModeActive: () => transformService.isPanModeActive,
		isOverOtherInteractive: (point) => getAllLabels().some((label) => label.contains(point)),
		isOtherInteractiveDragging: () => dimensionsWithTextLabelInteractionService.isDragging,
		getSnapStep: () => getActiveSnapStep(appSessionState.snapping),
		onChange: requestRedraw,
		onDragEnd: () => history.commit(),
		setSelectedShapeID: (uid: string | null) => setSelectedShapeID(uid)
	});

	dimensionsWithTextLabelInteractionService = new DimensionsWithTextLabelInteractionService({
		getTargets: getAllLabels,
		inputService,
		screenToWorld: (point) => transformService.screenToWorld(point),
		isTransformModeActive: () => transformService.isPanModeActive,
		onChange: requestRedraw,
		onDragEnd: () => history.commit(),
		editor: labelEditor,
	});

	objectSnapService = new ObjectSnapInteractionService({
		inputService,
		canvas: canvasRef.value!,
		isEnabled: () => appSessionState.snapOptionsToggles.endpoint,
		hasShape: (uid) => uid in store.geometry,
		getPolygonRef: (uid) => toRaw(store.crossSectionPolygon[uid]),
		getShapeIds: () => beamsDrawTargets.getTargets().map((beam) => beam.uid),
		getVertexOffsets,
		getPosition: (uid) => store.geometryExtra[uid]?.position ?? null,
		worldToScreen: (point) => transformService.worldToScreen(point),
		screenToWorld: (point) => transformService.screenToWorld(point),
		isTransformModeActive: () => transformService.isPanModeActive,
		isOverLabel: (point) => getAllLabels().some((label) => label.contains(point)),
		onSnap: (uid, position) => {
			updateGeometryExtraData({ uid, data: { position } });
			history.commit();
			// the moved shape is the one the right panel shows
			setSelectedShapeID(uid);
		},
		onChange: requestRedraw,
	});

	inputService.onWindowMouseDown(labelEditor.onWindowMouseDown);

	scene.addService(shapesInteractionService);
	scene.addService(dimensionsWithTextLabelInteractionService);
	scene.addService(objectSnapService);
	scene.initialize();
	unsubscribeProjectLoaded = eventBus.on('projectLoaded', () => {
		pendingFit = true;
		requestRedraw();
	});
	// the toggles may already be on when the view is mounted
	syncCompositeOverlays();
	history.setDragProbe(() => shapesInteractionService.isDragging || dimensionsWithTextLabelInteractionService.isDragging);
});

onUnmounted(() => {
	unsubscribeProjectLoaded?.();
	history.setDragProbe(null);
	scene?.deactivate();
	scene?.inputService.cleanup();
});
</script>

<template>
	<section class="view">
		<QuickActionsBar>
			<ViewQuickActions :actions="viewActions" />
			<QuickActionsDivider />
			<SnapControl />
			<QuickActionsDivider />
			<ObjectSnapActions />
			<QuickActionsDivider />
			<HatchingToggle />
			<QuickActionsDivider />
			<QuickSolverActions :toggles="quickSolver.toggles" @toggle="quickSolver.toggle" />
		</QuickActionsBar>
		<div class="canvas" ref="canvasWrapperRef">
			<canvas ref="canvasRef"></canvas>
			<input v-if="editing" :ref="labelEditor.editorInputRef" v-model="editText" type="text" inputmode="decimal"
				class="dimension-editor" :class="`dimension-editor--${editing.label.axis}`"
				:style="{ left: `${editorPosition.left}px`, top: `${editorPosition.top}px`, width: `max(${EDITOR_MIN_WIDTH}px, ${editText.length + 2}ch)` }"
				aria-label="Dimension value" @keydown="onEditorKeyDown" @wheel.prevent="onEditorWheel" />
		</div>
	</section>
</template>

<style scoped>
/* the view: the canvas fills it and the quick actions bar floats over its top center */
.view {
	position: relative;
	display: flex;
	flex-direction: column;
	height: 100%;
	min-height: 0;
	overflow: hidden;
}

/* the area the canvas fills; no border or padding, because the canvas is sized from its border box */
.canvas {
	position: relative;
	flex: 1;
	min-height: 0;
	overflow: hidden;
	background: var(--color-surface-canvas);
}

/* sits over the number it edits, so the background is opaque; the translate puts the matching edge on the anchor */
.dimension-editor {
	position: absolute;
	z-index: 1;
	height: 28px;
	padding: 0 6px;
	border: 1px solid var(--color-border-subtle);
	background: var(--color-surface-canvas);
	color: var(--color-text);
	font-size: 14px;
	outline: none;
	box-sizing: border-box;
	text-align: center;
}

.dimension-editor--x {
	transform: translate(-50%, -100%);
}

.dimension-editor--y {
	transform: translate(-100%, -50%);
}
</style>
