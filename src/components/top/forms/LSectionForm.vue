<script setup lang="ts">
import { SHAPE_TYPES } from '../../../interfaces/beams/common.types.ts';
import type { LSectionGeometry } from '../../../interfaces/beams/LSection.types.ts';
import SectionShapeLayout from '../form/SectionShapeLayout.vue';
import ShapeCanvasPreview from '../form/ShapeCanvasPreview.vue';
import SectionField from '../form/SectionField.vue';
import IsNegativeField from '../form/IsNegativeField.vue';
import { type WatchStoreGeometryProps, useStoreGeometryWatcher } from './composables/useStoreGeometryWatcher.ts';
import { useSimpleFormSolver } from './composables/useSimpleFormSolver.ts';

const getDefault = (): LSectionGeometry => ({
	isNegative: false,
	rotation: 0,
	type: SHAPE_TYPES.L_SECTION,
	h: 100,
	t_f1: 6,
	w: 50,
	t_f2: 6,
	r: 2,
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
		<SectionField v-model="geometry.h" label="Vertical flange height (h)" unit="mm" />
		<SectionField v-model="geometry.t_f1" label="Vertical flange thickness (t_f1)" unit="mm" />
		<SectionField v-model="geometry.w" label="Horizontal flange width (w)" unit="mm" />
		<SectionField v-model="geometry.t_f2" label="Horizontal flange thickness (t_f2)" unit="mm" />
		<SectionField v-model="geometry.r" label="Fillet radius (r)" unit="mm" />
	</SectionShapeLayout>
</template>