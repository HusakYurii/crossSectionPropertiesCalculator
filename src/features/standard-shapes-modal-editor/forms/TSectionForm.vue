<script setup lang="ts">
import { SHAPE_TYPES } from '@/shared/shapes/types/common.types';
import type { TSectionGeometry } from '@/shared/shapes/types/TSection.types';
import SectionShapeLayout from '../components/SectionShapeLayout.vue';
import ShapeCanvasPreview from '../components/ShapeCanvasPreview.vue';
import SectionField from '@/shared/components/form/SectionField.vue';
import IsNegativeField from '@/shared/components/form/IsNegativeField.vue';
import { openInfoPanel } from '@/store/ui/infoPanel';
import { useStoreGeometryWatcher } from '@/store/composables/useStoreGeometryWatcher';
import type { WatchStoreGeometryProps } from '@/store/composables/useStoreGeometryWatcher.types';
import { useSimpleFormSolver } from '../composables/useSimpleFormSolver';
import { T_SECTION_FIELDS } from '@/shared/shapes';
import type { SectionFormExposeSource } from '../sectionForm.types';

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

defineExpose({ geometry, crossSectionProperties, crossSectionPolygon } satisfies SectionFormExposeSource);
</script>

<template>
	<!-- there is no T section picture; the canvas preview slot is always used, so the image is never rendered -->
	<SectionShapeLayout image="" alt="T section">
		<template #preview>
			<ShapeCanvasPreview :geometry="geometry" />
		</template>
		<IsNegativeField v-model="geometry.isNegative" @info="openInfoPanel('whatIsNegativeArea')" />
		<SectionField v-model="geometry.rotation" label="Rotation" unit="deg" />
		<SectionField v-for="field in T_SECTION_FIELDS" :key="field.key" v-model="geometry[field.key]" :label="field.label" :unit="field.unit" />
	</SectionShapeLayout>
</template>
