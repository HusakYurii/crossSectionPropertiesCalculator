<script setup lang="ts">
import { SHAPE_TYPES } from '../../../interfaces/beams/common.types.ts';
import type { ISectionGeometry } from '../../../interfaces/beams/ISection.types.ts';
import SectionShapeLayout from '../form/SectionShapeLayout.vue';
import ShapeCanvasPreview from '../form/ShapeCanvasPreview.vue';
import SectionField from '../form/SectionField.vue';
import IsNegativeField from '../form/IsNegativeField.vue';
import { useStoreGeometryWatcher, type WatchStoreGeometryProps } from './composables/useStoreGeometryWatcher.ts';
import { useSimpleFormSolver } from './composables/useSimpleFormSolver.ts';
import { I_SECTION_FIELDS } from './fields/shapeFields.ts';

const getDefault = (): ISectionGeometry => ({
	isNegative: false,
	rotation: 0,
	type: SHAPE_TYPES.I_SECTION,
	h: 127,
	t_f1: 7.6,
	b1: 36,
	w1: 76,
	r1: 2,
	t_w: 4,
	r2: 2,
	t_f2: 7.6,
	b2: 36,
	w2: 76,
});

const props = defineProps<WatchStoreGeometryProps>()

const { geometry } = useStoreGeometryWatcher(props, getDefault)
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
		<SectionField v-for="field in I_SECTION_FIELDS" :key="field.key" v-model="geometry[field.key]" :label="field.label" :unit="field.unit" />
	</SectionShapeLayout>
</template>