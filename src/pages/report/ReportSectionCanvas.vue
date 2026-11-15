<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { appSessionState, store } from '../../store/store';
import type { CrossSectionProperties } from '../../interfaces/sectionProperties';
import { BeamsDrawTargetCollection } from '../../components/middle/view/canvas/BeamsDrawTargetCollection';
import { DrawTargetsCollection } from '../../components/middle/view/canvas/DrawTargetsCollection';
import { DimensionsWithTextLabel } from '../../components/middle/view/canvas/annotations/DimensionsWithTextLabel';
import { ShapeDimensionSource } from '../../components/middle/view/canvas/annotations/dimensionSources/ShapeDimensionSource';
import { AXIS_STYLE, DIMENSION_STYLE } from '../../constants/canvasStyle';
import { REPORT_SECTION_CANVAS } from '../../constants/canvasFit';
import { PropertyOverlays } from '../../components/middle/view/canvas/propertiesHelperPreviews';
import { createBeamView } from '../../components/middle/view/beams';
import { Grid, MainAxis } from '../../components/middle/view/shapes';
import { getShapesBounds, renderStaticScene } from './renderStaticScene';

const props = defineProps<{
	uids: string[];
	composite: CrossSectionProperties;
}>();

const src = ref('');

// same order as View.vue: grid, axes, beams, then what the properties add, then the dimension labels
const draw = (context: CanvasRenderingContext2D) => {
	const gridTargets = new DrawTargetsCollection<Grid>({ context });
	gridTargets.add(new Grid());
	gridTargets.draw(context);

	const axisTargets = new DrawTargetsCollection<MainAxis>({ context });
	axisTargets.add(new MainAxis());
	axisTargets.draw(context);

	const beams = new BeamsDrawTargetCollection({ context });
	beams.add(...props.uids.map(uid => createBeamView(uid, store)));
	beams.draw([], { hoveredShapeID: '', selectedShapeID: '' });

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
