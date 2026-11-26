<script setup lang="ts">
import { computed } from 'vue';
import { SHAPE_TYPES } from '@/shared/shapes/types/common.types';
import type { RectangleGeometry, RoundedRectangleGeometry } from '@/shared/shapes/types/RectSection.types';
import SectionShapeLayout from '../components/SectionShapeLayout.vue';
import ShapeCanvasPreview from '../components/ShapeCanvasPreview.vue';
import SectionField from '@/shared/components/form/SectionField.vue';
import IsNegativeField from '@/shared/components/form/IsNegativeField.vue';
import { openInfoPanel } from '@/store/ui/infoPanel';
import { useStoreGeometryWatcher } from '@/store/composables/useStoreGeometryWatcher';
import type { WatchStoreGeometryProps } from '@/store/composables/useStoreGeometryWatcher.types';
import { useSimpleFormSolver } from '../composables/useSimpleFormSolver';
import { RECTANGLE_FIELDS, RECT_CORNER_RADIUS_FIELD as CORNER_RADIUS_FIELD } from '@/shared/shapes';
import type { SectionFormExposeSource } from '../sectionForm.types';

const getDefault = (): RectangleGeometry | RoundedRectangleGeometry => ({
	isNegative: false,
	rotation: 0,
	type: SHAPE_TYPES.RECTANGLE,
	w: 50,
	h: 100,
	r: 4,
});

const props = defineProps<WatchStoreGeometryProps>();

const { geometry } = useStoreGeometryWatcher(props, getDefault);
const { crossSectionProperties, crossSectionPolygon } = useSimpleFormSolver(geometry);

// `geometry` is the only source of truth: a saved rounded rectangle opens with the box ticked, and the
// box can never disagree with the type that is drawn and solved
const rounded = computed({
	get: () => geometry.type === SHAPE_TYPES.ROUNDED_RECTANGLE,
	set: (isRounded: boolean) => {
		geometry.type = isRounded ? SHAPE_TYPES.ROUNDED_RECTANGLE : SHAPE_TYPES.RECTANGLE;
	},
});

defineExpose({ geometry, crossSectionProperties, crossSectionPolygon } satisfies SectionFormExposeSource);
</script>

<template>
	<SectionShapeLayout>
		<template #preview>
			<ShapeCanvasPreview :geometry="geometry" />
		</template>
		<IsNegativeField v-model="geometry.isNegative" @info="openInfoPanel('whatIsNegativeArea')" />
		<SectionField v-model="geometry.rotation" label="Rotation" unit="deg" />
		<SectionField v-for="field in RECTANGLE_FIELDS" :key="field.key" v-model="geometry[field.key]" :label="field.label" :unit="field.unit" />
		<SectionField v-model="geometry.r" :label="CORNER_RADIUS_FIELD.label" :unit="CORNER_RADIUS_FIELD.unit" :disabled="!rounded">
			<template #option>
				<input v-model="rounded" type="checkbox" />
			</template>
		</SectionField>
	</SectionShapeLayout>
</template>