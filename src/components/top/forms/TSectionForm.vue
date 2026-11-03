<script setup lang="ts">
import { SHAPE_TYPES } from '../../../interfaces/beams/common.types.ts';
import type { TSectionGeometry } from '../../../interfaces/beams/TSection.types.ts';
import SectionShapeLayout from '../form/SectionShapeLayout.vue';
import ShapeCanvasPreview from '../form/ShapeCanvasPreview.vue';
import SectionField from '../form/SectionField.vue';
import IsNegativeField from '../form/IsNegativeField.vue';
import { type WatchStoreGeometryProps, useStoreGeometryWatcher } from './composables/useStoreGeometryWatcher.ts';
import { useSimpleFormSolver } from './composables/useSimpleFormSolver.ts';
import { T_SECTION_FIELDS } from './fields/shapeFields.ts';

// a centered T by default: the flange overhangs the web by the same amount on both sides
const getDefault = (): TSectionGeometry => ({
	isNegative: false,
	rotation: 0,
	type: SHAPE_TYPES.T_SECTION,
	h: 100,
	t_w: 6,
	t_f: 8,
	w: 60,
	b: 27,
	r: 4,
});

const props = defineProps<WatchStoreGeometryProps>();

const { geometry } = useStoreGeometryWatcher(props, getDefault);
const { crossSectionProperties, crossSectionPolygon } = useSimpleFormSolver(geometry);

defineExpose({ geometry, crossSectionProperties, crossSectionPolygon });
</script>

<template>
	<!-- there is no T section picture; the canvas preview slot is always used, so the image is never rendered -->
	<SectionShapeLayout image="" alt="T section">
		<template #preview>
			<ShapeCanvasPreview :geometry="geometry" />
		</template>
		<IsNegativeField v-model="geometry.isNegative" />
		<SectionField v-model="geometry.rotation" label="Rotation" unit="deg" />
		<SectionField v-for="field in T_SECTION_FIELDS" :key="field.key" v-model="geometry[field.key]" :label="field.label" :unit="field.unit" />
	</SectionShapeLayout>
</template>
