<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import {
	ShapesInteractionService,
	DimensionsWithTextLabelInteractionService,
} from './services';

import { BeamsDrawTargetCollection } from './canvas/BeamsDrawTargetCollection.ts';
import { DrawTargetsCollection } from './canvas/DrawTargetsCollection.ts';
import { CanvasScene } from './canvas/CanvasScene';
import { NAVIGATION_HINTS } from './canvas/constants/canvasHints.ts';
import CanvasHint from './CanvasHint.vue';
import centerIconRaw from '../../../svg/center.svg?raw';
import resetZoomIconRaw from '../../../svg/reset-zoom.svg?raw';
import fitScreenIconRaw from '../../../svg/fit-screen.svg?raw';
import { DimensionsWithTextLabel } from './canvas/annotations/DimensionsWithTextLabel.ts';
import { unionBoundingBoxes } from './canvas/drawUtils.ts';
import { AXIS_COLORS } from './canvas/constants/axisColors.ts';

import { Grid, MainAxis } from './shapes';
import { appSessionState, setSelectedShapeID, store } from '../../../store/store';
import { createBeamView } from './beams';
import { history } from '../../../store/history';

let scene: CanvasScene;
let gridDrawTargets: DrawTargetsCollection<Grid>;
let axisDrawTargets: DrawTargetsCollection<MainAxis>;
let beamsDrawTargets: BeamsDrawTargetCollection;
let arrowLabelDrawTargets: DrawTargetsCollection<DimensionsWithTextLabel>;
let shapesInteractionService: ShapesInteractionService;
let dimensionsWithTextLabelInteractionService: DimensionsWithTextLabelInteractionService;

const HINTS = ['Drag a beam to move it', ...NAVIGATION_HINTS];
// screen pixels left between the shapes and the canvas edges by "Fit to screen"; it also leaves
// room for the dimension numbers, which are not part of the fitted bounds
const FIT_MARGIN = 72;

const fitToScreen = () => {
	const beamBounds = unionBoundingBoxes(beamsDrawTargets.getTargets().map(beam => beam.boundingBox));
	const allBounds = unionBoundingBoxes([
		beamBounds,
		...arrowLabelDrawTargets.getTargets().map(label => label.boundingBox),
	]);
	// the dimension lines reach back to the world axes, so a shape far out may not fit together with them: then the shape wins
	const bounds = allBounds && scene.transformService.canFit(allBounds, FIT_MARGIN) ? allBounds : beamBounds;
	if (bounds) {
		scene.transformService.fitToBounds(bounds, FIT_MARGIN);
	}
};

// quick actions bar: each one is a square icon button in the top left corner of the canvas
const QUICK_ACTIONS = [
	{ id: 'center', label: 'Center the canvas', icon: centerIconRaw, run: () => scene.centerView() },
	{ id: 'reset-zoom', label: 'Reset zoom', icon: resetZoomIconRaw, run: () => scene.resetZoom() },
	{ id: 'fit-to-screen', label: 'Fit to screen', icon: fitScreenIconRaw, run: fitToScreen },
];

// remembers which geometry type each beam on the canvas was built for, to notice when a shape changes kind
const beamTypes = new Map<string, string>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const canvasWrapperRef = ref<HTMLDivElement | null>(null);

const requestRedraw = () => scene.requestRedraw();

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
		}
	);

	arrowLabelDrawTargets.draw(context);
};

watch(() => appSessionState.redrawId, () => {
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
	const currentLabelShapeIds = new Set(arrowLabelDrawTargets.getTargets().map(val => val.shapeUid));
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
			new DimensionsWithTextLabel({ uid: `${uid}_x`, shapeUid: uid, axis: 'x', store, sessionState: appSessionState, color: AXIS_COLORS.x }),
			new DimensionsWithTextLabel({ uid: `${uid}_y`, shapeUid: uid, axis: 'y', store, sessionState: appSessionState, color: AXIS_COLORS.y }),
		);
	});

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
		maxZoom: 8,
		draw: redraw,
	});
	const { context, inputService, transformService } = scene;

	beamsDrawTargets = new BeamsDrawTargetCollection({ context });
	gridDrawTargets = new DrawTargetsCollection<Grid>({ context });
	axisDrawTargets = new DrawTargetsCollection<MainAxis>({ context });
	arrowLabelDrawTargets = new DrawTargetsCollection<DimensionsWithTextLabel>({ context });

	gridDrawTargets.add(new Grid());
	axisDrawTargets.add(new MainAxis());

	shapesInteractionService = new ShapesInteractionService({
		canvas: canvasRef.value!,
		drawTargets: beamsDrawTargets,
		inputService,
		screenToWorld: (point) => transformService.screenToWorld(point),
		isTransformModeActive: () => transformService.isPanModeActive,
		isOverOtherInteractive: (point) => arrowLabelDrawTargets.getTargets().some((label) => label.contains(point)),
		isOtherInteractiveDragging: () => dimensionsWithTextLabelInteractionService.isDragging,
		onChange: requestRedraw,
		onDragEnd: () => history.commit(),
		setSelectedShapeID: (uid: string | null) => setSelectedShapeID(uid)
	});

	dimensionsWithTextLabelInteractionService = new DimensionsWithTextLabelInteractionService({
		drawTargets: arrowLabelDrawTargets,
		inputService,
		screenToWorld: (point) => transformService.screenToWorld(point),
		isTransformModeActive: () => transformService.isPanModeActive,
		onChange: requestRedraw,
		onDragEnd: () => history.commit(),
	});

	scene.addService(shapesInteractionService);
	scene.addService(dimensionsWithTextLabelInteractionService);
	scene.initialize();
	history.setDragProbe(() => shapesInteractionService.isDragging || dimensionsWithTextLabelInteractionService.isDragging);
});

onUnmounted(() => {
	history.setDragProbe(null);
	scene?.deactivate();
});
</script>

<template>
	<section class="canvas" ref="canvasWrapperRef">
		<canvas ref="canvasRef"></canvas>
		<div class="quick-actions">
			<button v-for="action in QUICK_ACTIONS" :key="action.id" type="button" class="quick-actions__button"
				:data-tooltip="action.label" :aria-label="action.label" @click="action.run">
				<span class="quick-actions__icon" v-html="action.icon"></span>
			</button>
		</div>
		<CanvasHint :items="HINTS" />
	</section>
</template>

<style scoped>
.canvas {
	position: relative;
	height: 100%;
	min-height: 0;
	overflow: hidden;
	background: var(--color-surface-canvas);
}

/* quick actions bar: a column of squares in the top left corner, over the canvas */
.quick-actions {
	position: absolute;
	top: 8px;
	left: 8px;
	z-index: 1;
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.quick-actions__button {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	padding: 0;
	border: 1px solid var(--color-border-subtle);
	border-radius: 0;
	background: var(--color-surface-chrome);
	color: var(--color-text);
	cursor: pointer;
}

.quick-actions__button:hover {
	background: var(--color-fill-hover);
}

.quick-actions__icon {
	display: block;
	width: 18px;
	height: 18px;
}

/*
 * The tooltip is drawn from the data-tooltip attribute and not the native title attribute, because the browser
 * decides when a title appears and that cannot be sped up. It opens to the right of the button, since the bar sits
 * in the corner, and shows for hover and for keyboard focus. The delay is the transition-delay on the open state.
 */
.quick-actions__button::after {
	content: attr(data-tooltip);
	position: absolute;
	top: 50%;
	left: calc(100% + 6px);
	z-index: 2;
	padding: 4px 8px;
	border: 1px solid var(--color-border-subtle);
	background: var(--color-surface-chrome);
	box-shadow: 0 2px 6px var(--color-shadow);
	color: var(--color-text);
	font-size: 12px;
	white-space: nowrap;
	pointer-events: none;
	opacity: 0;
	transform: translateY(-50%);
	/* leaving is instant, so a tooltip never lingers over the canvas */
	transition: opacity 0.08s ease 0s;
}

.quick-actions__button:hover::after,
.quick-actions__button:focus-visible::after {
	opacity: 1;
	/* the 100 ms wait before it shows, so moving the mouse across the bar does not flash it */
	transition-delay: 0.1s;
}

.quick-actions__icon :deep(svg) {
	display: block;
	width: 100%;
	height: 100%;
}

.quick-actions__icon :deep(path),
.quick-actions__icon :deep(circle) {
	stroke: currentColor;
}
</style>
