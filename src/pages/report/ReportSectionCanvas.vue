<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { appSessionState, store } from '../../store/store';
import type { CrossSectionProperties } from '../../interfaces/sectionProperties';
import { BeamsDrawTargetCollection } from '../../components/middle/view/canvas/BeamsDrawTargetCollection';
import { DrawTargetsCollection } from '../../components/middle/view/canvas/DrawTargetsCollection';
import { DimensionsWithTextLabel } from '../../components/middle/view/canvas/annotations/DimensionsWithTextLabel';
import { AXIS_COLORS } from '../../components/middle/view/canvas/constants/axisColors';
import { PropertyOverlays } from '../../components/middle/view/canvas/propertiesHelperPreviews';
import { createBeamView } from '../../components/middle/view/beams';
import { Grid, MainAxis } from '../../components/middle/view/shapes';
import { getShapesBounds, renderStaticScene } from './renderStaticScene';

const props = defineProps<{
	uids: string[];
	composite: CrossSectionProperties;
}>();

const WIDTH = 680;
const HEIGHT = 420;
const FIT_MARGIN = 0.75;
// the sizes of the annotations on the part drawings (DimensionsWithLabel): at the editor's 2.7 the position lines
// are as heavy as the shape outlines, which is too much in a drawing this small
const DIMENSION_LINE_WIDTH = 1.89;
const DIMENSION_ARROW_HEAD_SIZE = 9.45;

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
	const labelStyle = { store, sessionState: appSessionState, lineWidth: DIMENSION_LINE_WIDTH, arrowHeadSize: DIMENSION_ARROW_HEAD_SIZE };
	props.uids.forEach(uid => {
		labels.add(
			new DimensionsWithTextLabel({ uid: `${uid}_x`, shapeUid: uid, axis: 'x', color: AXIS_COLORS.x, ...labelStyle }),
			new DimensionsWithTextLabel({ uid: `${uid}_y`, shapeUid: uid, axis: 'y', color: AXIS_COLORS.y, ...labelStyle }),
		);
	});
	labels.draw();
};

onMounted(() => {
	src.value = renderStaticScene({
		width: WIDTH,
		height: HEIGHT,
		margin: FIT_MARGIN,
		bounds: getShapesBounds(store, props.uids, { includeOrigin: true }),
		draw,
	});
});
</script>

<template>
	<img v-if="src" :src="src" class="report-figure" :width="WIDTH" :height="HEIGHT" alt="Cross section">
</template>
