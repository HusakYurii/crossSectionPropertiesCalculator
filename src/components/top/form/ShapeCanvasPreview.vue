<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { sectionModalState } from '../../../store/sectionModal';
import { setShowRotation, store } from '../../../store/store';
import { Canvas, type CanvasSize, type CanvasTransformState } from '../../middle/view/canvas/Canvas';
import { BeamsDrawTargetCollection } from '../../middle/view/canvas/BeamsDrawTargetCollection';
import { ResizeService } from '../../middle/view/services/ResizeService';
import { GenericBeamView, type GenericBeamViewParams } from '../../middle/view/beams';
import { HollowTubeBeam } from '../../middle/view/beams/HollowTubeBeam';
import { HollowRectangleBeam } from '../../middle/view/beams/HollowRectangleBeam';
import { SHAPE_TYPES, type Geometry } from '../../../interfaces/beams/common.types';
import { useCrossSectionPropertiesSolver } from '../forms/composables/useCrossSectionPropertiesSolver';
import { useDebounce } from '../../../composables/useDebounce';
import { DrawTargetsCollection, type DrawableTarget } from '../../middle/view/canvas/DrawTargetsCollection';
import { buildAnnotations } from './annotations';
import { PropertyOverlays } from '../../middle/view/canvas/propertiesHelperPreviews';
import { degToRad } from '../../../mathUtils/anglesMath';
import { Grid } from '../../middle/view/shapes';

const props = defineProps<{
	geometry: Geometry;
}>();

const PREVIEW_UID = 'preview';
const FIT_MARGIN = 0.8;
// when unchecked the preview always shows the shape unrotated; annotations follow either way
const showRotation = computed({
	get: () => sectionModalState.showRotation,
	set: (value: boolean) => {
		sectionModalState.showRotation = value;
		const uid = sectionModalState.selectedShapeUID;
		if (uid && uid in store.geometry) {
			setShowRotation(uid, value);
		}
	},
});

const specialBeamMap = {
	[SHAPE_TYPES.HOLLOW_TUBE]: HollowTubeBeam,
	[SHAPE_TYPES.HOLLOW_RECTANGLE]: HollowRectangleBeam,
	[SHAPE_TYPES.HOLLOW_ROUNDED_RECTANGLE]: HollowRectangleBeam,
} as const;

const canvasRef = ref<HTMLCanvasElement | null>(null);
const wrapperRef = ref<HTMLDivElement | null>(null);

const { crossSectionProperties, crossSectionPolygon, calculateProperties } = useCrossSectionPropertiesSolver();

const shadowStore = reactive({
	geometry: { [PREVIEW_UID]: props.geometry },
	geometryExtra: { [PREVIEW_UID]: { name: '', position: { x: 0, y: 0 } } },
	crossSectionProperties: { [PREVIEW_UID]: crossSectionProperties.value },
	crossSectionPolygon: { [PREVIEW_UID]: crossSectionPolygon.value },
});

let canvas: Canvas;
let drawTargets: BeamsDrawTargetCollection;
let gridTargets: DrawTargetsCollection<Grid>;
let axisTargets: DrawTargetsCollection<DrawableTarget>;
// the preview draws the shape centered on its centroid, which is the world origin, and the beam draws the centroid cross
const overlays = new PropertyOverlays();
let annotations: DrawTargetsCollection<DrawableTarget>;
let resizeService: ResizeService;
let beam: GenericBeamView;

const buildBeam = () => {
	const BeamClass = specialBeamMap[props.geometry.type as keyof typeof specialBeamMap] ?? GenericBeamView;
	const params: GenericBeamViewParams = { uid: PREVIEW_UID, store: shadowStore as any };
	return new BeamClass(params as any);
};

const computeFitTransform = (): CanvasTransformState => {
	const points = beam.pathPoints;
	const { displayWidth, displayHeight } = canvas.canvasSize;

	if (points.length === 0 || !displayWidth || !displayHeight) {
		return { zoom: 1, panX: 0, panY: 0 };
	}

	let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
	for (const { x, y } of points) {
		minX = Math.min(minX, x);
		minY = Math.min(minY, y);
		maxX = Math.max(maxX, x);
		maxY = Math.max(maxY, y);
	}

	const width = maxX - minX || 1;
	const height = maxY - minY || 1;
	const cx = minX + width / 2;
	const cy = minY + height / 2;

	const zoom = Math.min(displayWidth / width, displayHeight / height) * FIT_MARGIN;

	return { zoom, panX: -cx * zoom, panY: cy * zoom };
};

const redraw = () => {
	if (!canvas || !drawTargets) {
		return;
	}


	// first pass off-screen just to refresh beam.pathPoints (only computed as a side effect of draw()),
	// so the fit transform below reflects the current geometry, not the previous one
	canvas.clearAndApplyTransforms();
	gridTargets.draw();
	drawTargets.draw([], { hoveredShapeID: '', selectedShapeID: '' });

	canvas.clearAndApplyTransforms(computeFitTransform());
	gridTargets.draw();
	drawTargets.draw([], { hoveredShapeID: '', selectedShapeID: '' });
	// axes go over the shape (so the centroid stays visible) but under the annotations
	axisTargets.draw();
	annotations.draw();
};

const recalc = () => {
	// rotation is baked into the polygon by the solver, so the annotations must use the very
	// same geometry (and the centroid it produces) to stay attached to the shape
	const geometry = showRotation.value ? props.geometry : { ...props.geometry, rotation: 0 };
	calculateProperties(geometry);
	// degrees in the geometry, same conversion the solver applies
	const shapeRotation = degToRad(geometry.rotation ?? 0);
	// The polygon is already rotated before the solver runs, so theta_p is relative to the screen axes.
	overlays.update({ properties: crossSectionProperties.value, shapeRotation });

	shadowStore.crossSectionProperties[PREVIEW_UID] = crossSectionProperties.value;
	shadowStore.crossSectionPolygon[PREVIEW_UID] = crossSectionPolygon.value;

	drawTargets.delete(PREVIEW_UID);
	beam = buildBeam();
	drawTargets.add(beam);

	const { centroid_x, centroid_y } = crossSectionProperties.value;
	annotations.cleanUp();
	annotations.add(...buildAnnotations(geometry, { x: centroid_x, y: centroid_y }));

	redraw();
};

const onResize = (size: CanvasSize) => {
	canvas.resize(size);
	redraw();
};

const [debouncedRecalc] = useDebounce(recalc, 150);

watch(() => props.geometry, debouncedRecalc, { deep: true });
// a toggle is a single click, so redraw right away instead of waiting for the debounce
watch(showRotation, recalc);

onMounted(() => {
	canvas = new Canvas(canvasRef.value!);
	drawTargets = new BeamsDrawTargetCollection({ context: canvas.context });
	gridTargets = new DrawTargetsCollection<Grid>({ context: canvas.context });
	gridTargets.add(new Grid());
	axisTargets = new DrawTargetsCollection<DrawableTarget>({ context: canvas.context });
	axisTargets.add(...overlays.targets);
	annotations = new DrawTargetsCollection<DrawableTarget>({ context: canvas.context });

	resizeService = new ResizeService({
		wrapper: wrapperRef.value!,
		minSize: { width: 100, height: 100 },
		onResize,
	});
	resizeService.initialize();

	recalc();
});

onUnmounted(() => {
	resizeService?.deactivate();
});
</script>

<template>
	<div class="shape-canvas-preview" ref="wrapperRef">
		<label class="shape-canvas-preview__rotation">
			<span>Show rotation</span>
			<input v-model="showRotation" type="checkbox" />
		</label>
		<canvas ref="canvasRef"></canvas>
	</div>
</template>

<style scoped>
.shape-canvas-preview {
	position: relative;
	width: 100%;
	height: 100%;
	min-height: 200px;
}

.shape-canvas-preview__rotation {
	position: absolute;
	top: 0;
	right: 0;
	z-index: 1;
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 3px 8px;
	border-radius: 5px;
	background: var(--color-fill-faint);
	font-size: 12px;
	font-weight: 600;
	user-select: none;
}

.shape-canvas-preview__rotation span {
	color: var(--color-text);
}

.shape-canvas-preview__rotation input {
	cursor: pointer;
	accent-color: var(--color-control-accent);
}

.shape-canvas-preview canvas {
	display: block;
}
</style>
