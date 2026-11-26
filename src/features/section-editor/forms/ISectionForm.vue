<script setup lang="ts">
import { SHAPE_TYPES } from '@/shared/shapes/types/common.types';
import type { ISectionGeometry } from '@/shared/shapes/types/ISection.types';
import SectionShapeLayout from '../components/SectionShapeLayout.vue';
import ShapeCanvasPreview from '../components/ShapeCanvasPreview.vue';
import SectionField from '@/shared/components/form/SectionField.vue';
import IsNegativeField from '@/shared/components/form/IsNegativeField.vue';
import { openInfoPanel } from '@/store/ui/infoPanel';
import { useStoreGeometryWatcher } from '@/store/composables/useStoreGeometryWatcher';
import type { WatchStoreGeometryProps } from '@/store/composables/useStoreGeometryWatcher.types';
import { useSimpleFormSolver } from '../composables/useSimpleFormSolver';
import { I_SECTION_FIELDS } from '@/shared/shapes';
import type { SectionFormExposeSource } from '../sectionForm.types';

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

defineExpose({ geometry, crossSectionProperties, crossSectionPolygon } satisfies SectionFormExposeSource);
</script>

<template>
	<SectionShapeLayout>
		<template #preview>
			<ShapeCanvasPreview :geometry="geometry" />
		</template>
		<IsNegativeField v-model="geometry.isNegative" @info="openInfoPanel('whatIsNegativeArea')" />
		<SectionField v-model="geometry.rotation" label="Rotation" unit="deg" />
		<SectionField v-for="field in I_SECTION_FIELDS" :key="field.key" v-model="geometry[field.key]" :label="field.label" :unit="field.unit" />
	</SectionShapeLayout>
</template>