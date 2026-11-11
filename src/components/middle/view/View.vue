<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue';
import { toast } from 'vue3-toastify';
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
import { appSessionState, setSelectedShapeID, store, updateGeometryExtraData } from '../../../store/store';
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

// the number editor over a dimension label; nothing is written to the store until it is applied
const editorInputRef = ref<HTMLInputElement | null>(null);
const editing = shallowRef<{ label: DimensionsWithTextLabel; prefill: string } | null>(null);
const editText = ref('');
const editorPosition = ref({ left: 0, top: 0 });
const DECIMAL_PATTERN = /^[+-]?(\d+\.?\d*|\.\d+)$/;
// the input is never narrower than this, and grows with a longer text so it always covers the drawn number
const EDITOR_MIN_WIDTH = 72;

const updateEditorPosition = () => {
	const label = editing.value?.label;
	if (!label) {
		return;
	}

	// the shape was deleted (or undone away) while its number was being edited
	if (label.value === undefined) {
		editing.value = null;
		return;
	}

	const { x, y } = scene.transformService.worldToScreen(label.labelAnchor);
	editorPosition.value = { left: x, top: y };
};

const startEditing = (label: DimensionsWithTextLabel) => {
	if (label.value === undefined) {
		return;
	}

	// the exact value, not the rounded number on the canvas
	const prefill = String(label.value);
	editing.value = { label, prefill };
	editText.value = prefill;
	updateEditorPosition();
	nextTick(() => {
		editorInputRef.value?.focus({ preventScroll: true });
		editorInputRef.value?.select();
	});
};

const cancelEditing = () => {
	editing.value = null;
};

const applyEditing = () => {
	const current = editing.value;
	// cleared first, so nothing below can run apply a second time
	editing.value = null;
	if (!current || editText.value === current.prefill) {
		return;
	}

	const trimmed = editText.value.trim();
	// checked before Number(): Number('') is 0
	if (trimmed === '') {
		return;
	}

	const normalized = trimmed.replace(',', '.');
	// plain decimals only: Number() would also take '0x10' or '1e3'
	if (!DECIMAL_PATTERN.test(normalized)) {
		return;
	}

	const value = Number(normalized);
	const { shapeUid, axis } = current.label;
	const stored = store.geometryExtra[shapeUid];
	// same number typed another way (12.50 over 12.5, -0 over 0): no write, and no false overlap warning
	if (!Number.isFinite(value) || !stored || value === stored.position[axis]) {
		return;
	}

	const position = { ...stored.position, [axis]: value };
	if (!shapesInteractionService.canMoveTo(shapeUid, position)) {
		toast.warning('The shape would overlap another shape there, so its position was not changed.');
		return;
	}

	updateGeometryExtraData({ uid: shapeUid, data: { position } });
	history.commit();
};

// the input opens right under the pointer, so it would otherwise swallow the zoom the canvas listens for
const onEditorWheel = (event: WheelEvent) => {
	canvasRef.value?.dispatchEvent(new WheelEvent('wheel', event));
};

const onEditorKeyDown = (event: KeyboardEvent) => {
	if (event.key === 'Enter' || event.key === 'Tab') {
		event.preventDefault();
		applyEditing();
	}
	else if (event.key === 'Escape') {
		event.preventDefault();
		cancelEditing();
	}
};

// Click away applies the value. This runs in the capture phase, like the flush in RightPanel: the canvas
// handlers read the shape's position on mousedown, before a blur would fire, so a drag would overwrite the typed value.
const onWindowMouseDown = (event: MouseEvent) => {
	if (!editing.value || event.target === editorInputRef.value) {
		return;
	}

	applyEditing();
};

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
	updateEditorPosition();
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
		onEditRequest: startEditing,
	});

	scene.addService(shapesInteractionService);
	scene.addService(dimensionsWithTextLabelInteractionService);
	scene.initialize();
	window.addEventListener('mousedown', onWindowMouseDown, true);
	history.setDragProbe(() => shapesInteractionService.isDragging || dimensionsWithTextLabelInteractionService.isDragging);
});

onUnmounted(() => {
	window.removeEventListener('mousedown', onWindowMouseDown, true);
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
		<input v-if="editing" ref="editorInputRef" v-model="editText" type="text" inputmode="decimal"
			class="dimension-editor" :class="`dimension-editor--${editing.label.axis}`"
			:style="{ left: `${editorPosition.left}px`, top: `${editorPosition.top}px`, width: `max(${EDITOR_MIN_WIDTH}px, ${editText.length + 2}ch)` }"
			aria-label="Dimension value" @keydown="onEditorKeyDown" @wheel.prevent="onEditorWheel" />
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
