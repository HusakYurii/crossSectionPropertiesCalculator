<script setup lang="ts">
import { ref, computed } from 'vue';
import { SHAPE_TYPES } from '../../../interfaces/beams/common.types.ts';
import type { OSectionGeometry, OSectionHollowGeometry } from '../../../interfaces/beams/OSection.types.ts';
import SectionShapeLayout from '../form/SectionShapeLayout.vue';
import ShapeCanvasPreview from '../form/ShapeCanvasPreview.vue';
import SectionField from '../form/SectionField.vue';
import IsNegativeField from '../form/IsNegativeField.vue';
import { type WatchStoreGeometryProps, useStoreGeometryWatcher } from './composables/useStoreGeometryWatcher.ts';
import { useSimpleFormSolver } from './composables/useSimpleFormSolver.ts';
import { TUBE_FIELDS, INNER_DIAMETER_FIELD } from './fields/shapeFields.ts';

const getDefault = (): OSectionGeometry | OSectionHollowGeometry => ({
	isNegative: false,
	rotation: 0,
	type: SHAPE_TYPES.TUBE,
	d1: 30,
});

const props = defineProps<WatchStoreGeometryProps>();
const { geometry } = useStoreGeometryWatcher(props, getDefault);
const { crossSectionProperties, crossSectionPolygon } = useSimpleFormSolver(geometry);

// OSectionGeometry (TUBE) has no d2 field at all, so d2 only exists on `geometry` while the tube is
// hollow, matching the discriminated union in OSection.types.ts. The last inner diameter is remembered
// separately so that switching hollow off and on again brings it back.
const DEFAULT_INNER_DIAMETER = 20;
const lastInnerDiameter = ref((geometry as Partial<OSectionHollowGeometry>).d2 ?? DEFAULT_INNER_DIAMETER);

// `geometry` is the only source of truth: a saved hollow tube opens with the box ticked, and the box
// can never disagree with the type that is drawn and solved
const hollow = computed({
	get: () => geometry.type === SHAPE_TYPES.HOLLOW_TUBE,
	set: (isHollow: boolean) => {
		if (isHollow) {
			// one assignment, so the preview and the solver see the new type and d2 together
			Object.assign(geometry, { type: SHAPE_TYPES.HOLLOW_TUBE, d2: lastInnerDiameter.value });
		} else {
			geometry.type = SHAPE_TYPES.TUBE;
			delete (geometry as Partial<OSectionHollowGeometry>).d2;
		}
	},
});

const innerDiameter = computed({
	get: () => (geometry as Partial<OSectionHollowGeometry>).d2 ?? lastInnerDiameter.value,
	set: (value: number) => {
		lastInnerDiameter.value = value;
		if (hollow.value) {
			(geometry as OSectionHollowGeometry).d2 = value;
		}
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
		<SectionField v-for="field in TUBE_FIELDS" :key="field.key" v-model="geometry[field.key]" :label="field.label" :unit="field.unit" />
		<SectionField v-model="innerDiameter" :label="INNER_DIAMETER_FIELD.label" :unit="INNER_DIAMETER_FIELD.unit" :disabled="!hollow">
			<template #option>
				<input v-model="hollow" type="checkbox" />
			</template>
		</SectionField>
	</SectionShapeLayout>
</template>