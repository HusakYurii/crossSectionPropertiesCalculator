<script setup lang="ts">
import SectionShapeLayout from '../form/SectionShapeLayout.vue';
import ShapeCanvasPreview from '../form/ShapeCanvasPreview.vue';
import SectionField from '../form/SectionField.vue';
import IsNegativeField from '../form/IsNegativeField.vue';
import { SHAPE_TYPES } from '../../../interfaces/beams/common.types.ts';
import type { CSectionGeometry } from '../../../interfaces/beams/CSection.types.ts';
import { useStoreGeometryWatcher, type WatchStoreGeometryProps } from './composables/useStoreGeometryWatcher.ts';
import { useSimpleFormSolver } from './composables/useSimpleFormSolver.ts';

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
		<SectionField v-model="geometry.h" label="Height (h)" unit="mm" />
		<SectionField v-model="geometry.t_w" label="Web thickness (t_w)" unit="mm" />
		<SectionField v-model="geometry.t_f1" label="Top flange thickness (t_f1)" unit="mm" />
		<SectionField v-model="geometry.w1" label="Top flange width (w1)" unit="mm" />
		<SectionField v-model="geometry.r1" label="Top web fillet (r1)" unit="mm" />
		<SectionField v-model="geometry.t_f2" label="Bottom flange thickness (t_f2)" unit="mm" />
		<SectionField v-model="geometry.w2" label="Bottom flange width (w2)" unit="mm" />
		<SectionField v-model="geometry.r2" label="Bottom web fillet (r2)" unit="mm" />
	</SectionShapeLayout>
</template>