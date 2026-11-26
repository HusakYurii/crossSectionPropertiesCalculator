<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { store } from '@/store/store';
import { appSessionState } from '@/store/appSessionState';
import type { CrossSectionProperties } from '@/shared/types/sectionProperties';
import {
	BeamsDrawTargetCollection,
	DrawTargetsCollection,
	DimensionsWithTextLabel,
	PropertyOverlays,
	createBeamView,
	Grid,
	MainAxis,
	ScaleBar,
	type BeamViewDeps,
} from '@/shared/canvas';
import { ShapeDimensionSource } from '@/store/dimensionSources/ShapeDimensionSource';
import { AXIS_STYLE, DIMENSION_STYLE } from '@/shared/canvas/canvasStyle';
import { REPORT_SECTION_CANVAS } from '../constants';
import { getHollowRectangleRingLengths } from '@/solvers';
import { getShapesBounds, renderStaticScene } from '../renderStaticScene';

const props = defineProps<{
	uids: string[];
	composite: CrossSectionProperties;
}>();

const src = ref('');
const beamDeps: BeamViewDeps = { getHollowRectangleRingLengths };

// same order as View.vue: grid, axes, beams, then what the properties add, then the dimension labels
const draw = (context: CanvasRenderingContext2D) => {
	const gridTargets = new DrawTargetsCollection<Grid>({ context });
	gridTargets.add(new Grid());
	gridTargets.draw(context);

	const axisTargets = new DrawTargetsCollection<MainAxis>({ context });
	axisTargets.add(new MainAxis());
	axisTargets.draw(context);

	const beams = new BeamsDrawTargetCollection({ context });
	beams.add(...props.uids.map(uid => createBeamView(uid, store, beamDeps)));
	beams.draw([], { hoveredShapeID: '', selectedShapeID: '' }, { showHatching: true });

	// the composite centroid, the principal axes and the gyration ellipse
	const overlays = new PropertyOverlays({ drawCentroid: true });
	overlays.update({
		properties: props.composite,
		center: { x: props.composite.centroid_x, y: props.composite.centroid_y },
	});
	const overlayTargets = new DrawTargetsCollection({ context });
	overlayTargets.add(...overlays.targets);
	overlayTargets.draw();

	const labels = new DrawTargetsCollection<DimensionsWithTextLabel>({ context });
	// the report uses the thinner DIMENSION_STYLE instead of the editor's EDITABLE_DIMENSION_STYLE: at the editor's weight
	// the position lines are too heavy for a drawing this small
	const labelStyle = { lineWidth: DIMENSION_STYLE.LINE_WIDTH, arrowHeadSize: DIMENSION_STYLE.ARROW_HEAD_SIZE };
	props.uids.forEach(uid => {
		labels.add(
			new DimensionsWithTextLabel({ uid: `${uid}_x`, axis: 'x', source: new ShapeDimensionSource(uid, store, appSessionState), color: AXIS_STYLE.COLORS.x, ...labelStyle }),
			new DimensionsWithTextLabel({ uid: `${uid}_y`, axis: 'y', source: new ShapeDimensionSource(uid, store, appSessionState), color: AXIS_STYLE.COLORS.y, ...labelStyle }),
		);
	});
	labels.draw();

	// last, so the exported image carries a scale
	const scaleBarTargets = new DrawTargetsCollection<ScaleBar>({ context });
	scaleBarTargets.add(new ScaleBar());
	scaleBarTargets.draw();
};

onMounted(() => {
	src.value = renderStaticScene({
		width: REPORT_SECTION_CANVAS.WIDTH,
		height: REPORT_SECTION_CANVAS.HEIGHT,
		margin: REPORT_SECTION_CANVAS.FIT_MARGIN,
		bounds: getShapesBounds(store, props.uids, { includeOrigin: true }),
		draw,
	});
});
</script>

<template>
	<img v-if="src" :src="src" class="report-figure" :width="REPORT_SECTION_CANVAS.WIDTH" :height="REPORT_SECTION_CANVAS.HEIGHT" alt="Cross section">
</template>
