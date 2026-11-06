<script setup lang="ts">
import MenuWithDropDown from './MenuWithDropDown.vue';
import { openSectionModal } from '../../../store/sectionModal.ts';
import type { ShapeType } from '../../../store/sectionModal.ts';
import { SHAPE_TYPES } from '../../../interfaces/beams/common.types.ts';

const ADD_ITEMS: { value: ShapeType; label: string }[] = [
	{ value: SHAPE_TYPES.I_SECTION, label: 'I Shape' },
	{ value: SHAPE_TYPES.C_SECTION, label: 'C Shape' },
	{ value: SHAPE_TYPES.T_SECTION, label: 'T Shape' },
	{ value: SHAPE_TYPES.L_SECTION, label: 'L Shape' },
	{ value: SHAPE_TYPES.Z_SECTION, label: 'Z Shape' },
	{ value: SHAPE_TYPES.TUBE, label: 'Tube' },
	{ value: SHAPE_TYPES.RECTANGLE, label: 'Rectangle' },
	{ value: SHAPE_TYPES.HOLLOW_RECTANGLE, label: 'Hollow Rectangle' },
	{ value: SHAPE_TYPES.CUSTOM_SHAPE, label: 'Custom Shape' },
];

function handleAddNewSection(shapeType: (typeof ADD_ITEMS)[number]['value']) {
	openSectionModal({ shapeType, selectedShapeUID: null }); // it is a brand new data
}
</script>

<template>
	<MenuWithDropDown title="Add" :items="ADD_ITEMS" @select="handleAddNewSection" />
</template>
