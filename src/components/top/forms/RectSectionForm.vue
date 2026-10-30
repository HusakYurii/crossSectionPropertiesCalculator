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
		<SectionField v-model="geometry.w" label="Width (w)" unit="mm" />
		<SectionField v-model="geometry.h" label="Height (h)" unit="mm" />
		<SectionField v-model="geometry.r" label="Corner radius (r)" unit="mm" :disabled="!rounded">
			<template #option>
				<input v-model="rounded" type="checkbox" />
			</template>
		</SectionField>
	</SectionShapeLayout>
</template>