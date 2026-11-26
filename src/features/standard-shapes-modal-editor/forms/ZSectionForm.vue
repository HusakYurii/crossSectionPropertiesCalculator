<script setup lang="ts">
import { SHAPE_TYPES } from '@/shared/shapes/types/common.types';
import type { ZSectionGeometry } from '@/shared/shapes/types/ZSection.types';
import SectionShapeLayout from '../components/SectionShapeLayout.vue';
import ShapeCanvasPreview from '../components/ShapeCanvasPreview.vue';
import SectionField from '@/shared/components/form/SectionField.vue';
import IsNegativeField from '@/shared/components/form/IsNegativeField.vue';
import { openInfoPanel } from '@/store/ui/infoPanel';
import { useStoreGeometryWatcher } from '@/store/composables/useStoreGeometryWatcher';
import type { WatchStoreGeometryProps } from '@/store/composables/useStoreGeometryWatcher.types';
import { useSimpleFormSolver } from '../composables/useSimpleFormSolver';
import { Z_SECTION_FIELDS } from '@/shared/shapes';
import type { SectionFormExposeSource } from '../sectionForm.types';

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

defineExpose({ geometry, crossSectionProperties, crossSectionPolygon } satisfies SectionFormExposeSource);
</script>

<template>
	<SectionShapeLayout>
		<template #preview>
			<ShapeCanvasPreview :geometry="geometry" />
		</template>
		<IsNegativeField v-model="geometry.isNegative" @info="openInfoPanel('whatIsNegativeArea')" />
		<SectionField v-model="geometry.rotation" label="Rotation" unit="deg" />
		<SectionField v-for="field in Z_SECTION_FIELDS" :key="field.key" v-model="geometry[field.key]" :label="field.label" :unit="field.unit" />
	</SectionShapeLayout>
</template>