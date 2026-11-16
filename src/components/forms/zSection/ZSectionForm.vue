<script setup lang="ts">
import { SHAPE_TYPES } from '../../../interfaces/beams/common.types.ts';
import type { ZSectionGeometry } from '../../../interfaces/beams/ZSection.types.ts';
import SectionShapeLayout from '../components/SectionShapeLayout.vue';
import ShapeCanvasPreview from '../components/ShapeCanvasPreview.vue';
import SectionField from '../components/SectionField.vue';
import IsNegativeField from '../components/IsNegativeField.vue';
import { type WatchStoreGeometryProps, useStoreGeometryWatcher } from '../composables/useStoreGeometryWatcher.ts';
import { useSimpleFormSolver } from '../composables/useSimpleFormSolver.ts';
import { Z_SECTION_FIELDS } from './fields.ts';

const getDefault = (): ZSectionGeometry => ({
	isNegative: false,
	rotation: 0,
	type: SHAPE_TYPES.Z_SECTION,
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
		<SectionField v-for="field in Z_SECTION_FIELDS" :key="field.key" v-model="geometry[field.key]" :label="field.label" :unit="field.unit" />
	</SectionShapeLayout>
</template>