<script setup lang="ts">
import SectionShapeLayout from '../form/SectionShapeLayout.vue';
import ShapeCanvasPreview from '../form/ShapeCanvasPreview.vue';
import SectionField from '../form/SectionField.vue';
import IsNegativeField from '../form/IsNegativeField.vue';
import { SHAPE_TYPES } from '../../../interfaces/beams/common.types.ts';
import type { CSectionGeometry } from '../../../interfaces/beams/CSection.types.ts';
import { useStoreGeometryWatcher, type WatchStoreGeometryProps } from './composables/useStoreGeometryWatcher.ts';
import { useSimpleFormSolver } from './composables/useSimpleFormSolver.ts';
import { C_SECTION_FIELDS } from './fields/shapeFields.ts';

const getDefault = (): CSectionGeometry => ({
	isNegative: false,
	rotation: 0,
	type: SHAPE_TYPES.C_SECTION,
	h: 100,
	t_f1: 8.5,
	w1: 50,
	r1: 2,
	t_w: 5,
	r2: 2,
	t_f2: 8.5,
	w2: 50,
});

const props = defineProps<WatchStoreGeometryProps>();

const { geometry } = useStoreGeometryWatcher(props, getDefault);
const { crossSectionProperties, crossSectionPolygon } = useSimpleFormSolver(geometry);

defineExpose({ geometry, crossSectionProperties, crossSectionPolygon });
</script>

<template>
	<SectionShapeLayout>
		<template #preview>
			<ShapeCanvasPreview :geometry="geometry" />
		</template>
		<IsNegativeField v-model="geometry.isNegative" />
		<SectionField v-model="geometry.rotation" label="Rotation" unit="deg" />
		<SectionField v-for="field in C_SECTION_FIELDS" :key="field.key" v-model="geometry[field.key]" :label="field.label" :unit="field.unit" />
	</SectionShapeLayout>
</template>