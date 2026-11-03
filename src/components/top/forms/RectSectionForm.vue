<script setup lang="ts">
import { computed } from 'vue';
import { SHAPE_TYPES } from '../../../interfaces/beams/common.types.ts';
import type { RectangleGeometry, RoundedRectangleGeometry } from '../../../interfaces/beams/RectSection.types.ts';
import SectionShapeLayout from '../form/SectionShapeLayout.vue';
import ShapeCanvasPreview from '../form/ShapeCanvasPreview.vue';
import SectionField from '../form/SectionField.vue';
import IsNegativeField from '../form/IsNegativeField.vue';
import { type WatchStoreGeometryProps, useStoreGeometryWatcher } from './composables/useStoreGeometryWatcher.ts';
import { useSimpleFormSolver } from './composables/useSimpleFormSolver.ts';
import { RECTANGLE_FIELDS, CORNER_RADIUS_FIELD } from './fields/shapeFields.ts';

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

defineExpose({ geometry, crossSectionProperties, crossSectionPolygon });
</script>

<template>
	<SectionShapeLayout>
		<template #preview>
			<ShapeCanvasPreview :geometry="geometry" />
		</template>
		<IsNegativeField v-model="geometry.isNegative" />
		<SectionField v-model="geometry.rotation" label="Rotation" unit="deg" />
		<SectionField v-for="field in RECTANGLE_FIELDS" :key="field.key" v-model="geometry[field.key]" :label="field.label" :unit="field.unit" />
		<SectionField v-model="geometry.r" :label="CORNER_RADIUS_FIELD.label" :unit="CORNER_RADIUS_FIELD.unit" :disabled="!rounded">
			<template #option>
				<input v-model="rounded" type="checkbox" />
			</template>
		</SectionField>
	</SectionShapeLayout>
</template>