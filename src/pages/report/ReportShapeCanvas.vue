<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { store, type Store } from '../../store/store';
import { BeamsDrawTargetCollection } from '../../components/middle/view/canvas/BeamsDrawTargetCollection';
import { DrawTargetsCollection, type DrawableTarget } from '../../components/middle/view/canvas/DrawTargetsCollection';
import { PropertyOverlays } from '../../components/middle/view/canvas/propertiesHelperPreviews';
import { MeshView, createBeamView } from '../../components/middle/view/beams';
import { Grid } from '../../components/middle/view/shapes';
import { buildAnnotations } from '../../components/top/form/annotations';
import { degToRad } from '../../mathUtils/anglesMath';
import { getShapesBounds, renderStaticScene } from './renderStaticScene';
import { SHAPE_PREVIEW_FIT } from '../../constants/canvasFit';
import { MESH_STYLE } from '../../constants/canvasStyle';

const props = defineProps<{
	uid: string;
	width: number;
	height: number;
}>();


const src = ref('');

onMounted(() => {
	const geometry = store.geometry[props.uid];
	const properties = store.crossSectionProperties[props.uid];
	const mesh = store.crossSectionMesh[props.uid];

	// the shape alone, centered on its centroid, as the form preview does it
	const shadowStore = reactive({
		geometry: { [SHAPE_PREVIEW_FIT.UID]: geometry },
		geometryExtra: { [SHAPE_PREVIEW_FIT.UID]: { name: '', position: { x: 0, y: 0 } } },
		crossSectionProperties: { [SHAPE_PREVIEW_FIT.UID]: properties },
		crossSectionPolygon: { [SHAPE_PREVIEW_FIT.UID]: store.crossSectionPolygon[props.uid] },
	}) as unknown as Store;

	// same order as ShapeCanvasPreview: grid, beam, axes and ellipse, then the size annotations; the mesh goes over the beam's fill
	const draw = (context: CanvasRenderingContext2D) => {
		const gridTargets = new DrawTargetsCollection<Grid>({ context });
		gridTargets.add(new Grid());
		gridTargets.draw();

		const beams = new BeamsDrawTargetCollection({ context });
		beams.add(createBeamView(SHAPE_PREVIEW_FIT.UID, shadowStore));
		beams.draw([], { hoveredShapeID: '', selectedShapeID: '' });

		if (mesh) {
			// the mesh is in the solver's frame and the beam is drawn with its centroid on the origin
			context.save();
			context.translate(-properties.centroid_x, -properties.centroid_y);
			new MeshView(mesh, { screenLineWidth: MESH_STYLE.REPORT_LINE_WIDTH }).draw({ context });
			context.restore();
		}

		const overlays = new PropertyOverlays();
		overlays.update({ properties, shapeRotation: degToRad(geometry.rotation ?? 0) });
		const axisTargets = new DrawTargetsCollection<DrawableTarget>({ context });
		axisTargets.add(...overlays.targets);
		axisTargets.draw();

		const annotations = new DrawTargetsCollection<DrawableTarget>({ context });
		annotations.add(...buildAnnotations(geometry, { x: properties.centroid_x, y: properties.centroid_y }));
		annotations.draw();
	};

	src.value = renderStaticScene({
		width: props.width,
		height: props.height,
		margin: SHAPE_PREVIEW_FIT.MARGIN,
		bounds: getShapesBounds(shadowStore, [SHAPE_PREVIEW_FIT.UID]),
		draw,
	});
});
</script>

<template>
	<img v-if="src" :src="src" class="report-figure" :width="width" :height="height" alt="Shape drawing">
</template>
