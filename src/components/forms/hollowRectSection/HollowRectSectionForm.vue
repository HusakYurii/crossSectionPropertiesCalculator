<script setup lang="ts">
import { computed } from 'vue';
import { SHAPE_TYPES } from '../../../interfaces/beams/common.types.ts';
import type { HollowRectangleGeometry, RoundedHollowRectangleGeometry } from '../../../interfaces/beams/RectSection.types.ts';
import SectionShapeLayout from '../components/SectionShapeLayout.vue';
import ShapeCanvasPreview from '../components/ShapeCanvasPreview.vue';
import SectionField from '../components/SectionField.vue';
import IsNegativeField from '../components/IsNegativeField.vue';
import { type WatchStoreGeometryProps, useStoreGeometryWatcher } from '../composables/useStoreGeometryWatcher.ts';
import { useSimpleFormSolver } from '../composables/useSimpleFormSolver.ts';
import { HOLLOW_RECTANGLE_FIELDS, CORNER_RADIUS_FIELD } from './fields.ts';

const getDefault = (): HollowRectangleGeometry | RoundedHollowRectangleGeometry => ({
	isNegative: false,
	rotation: 0,
	type: SHAPE_TYPES.HOLLOW_RECTANGLE,
	// outer rectangle
	h1: 100,
	w1: 50,
	// inner rectangle
	h2: 80,
	w2: 30,
	r: 4,
});

const props = defineProps<WatchStoreGeometryProps>();
const { geometry } = useStoreGeometryWatcher(props, getDefault);
const { crossSectionProperties, crossSectionPolygon } = useSimpleFormSolver(geometry);

// `geometry` is the only source of truth: a saved rounded shape opens with the box ticked, and the
// box can never disagree with the type that is drawn and solved
const rounded = computed({
	get: () => geometry.type === SHAPE_TYPES.HOLLOW_ROUNDED_RECTANGLE,
	set: (isRounded: boolean) => {
		geometry.type = isRounded ? SHAPE_TYPES.HOLLOW_ROUNDED_RECTANGLE : SHAPE_TYPES.HOLLOW_RECTANGLE;
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
		<SectionField v-for="field in HOLLOW_RECTANGLE_FIELDS" :key="field.key" v-model="geometry[field.key]" :label="field.label" :unit="field.unit" />
		<SectionField v-model="geometry.r" :label="CORNER_RADIUS_FIELD.label" :unit="CORNER_RADIUS_FIELD.unit" :disabled="!rounded">
			<template #option>
				<input v-model="rounded" type="checkbox" />
			</template>
		</SectionField>
	</SectionShapeLayout>
</template>