<script setup lang="ts">
import CreateOrUpdateSectionDataModalWindow from './CreateOrUpdateSectionDataModalWindow.vue';
import { openSectionModal } from '../../store/sectionModal.ts';
import type { ShapeType } from '../../store/sectionModal.ts';
import { SHAPE_TYPES } from '../../interfaces/beams/common.types.ts';
import {  uploadJSON } from '../../fileLoader/uploadFile.ts';

import { importStoreData} from '../../store/storeDataImporter.ts';
import { exportStoreData } from '../../store/storeDataExporter.ts';
import { store } from '../../store/store.ts';
import { compositeCrossSectionPropertiesSolver } from '../../solvers/CompositeCrossSectionPropertiesSolver.ts';
import { CROSS_SECTION_UNITS, type CrossSectionProperties } from '../../interfaces/sectionProperties/index.ts';

type ActionNames = "import" | "export" | "results";

const ACTIONS_STRATEGIES: Record<ActionNames, () => void> = {
	import: () => { 
		uploadJSON((file ) => {
			importStoreData(file)
		})
	},
	export: () => {
		exportStoreData();
	},
	results: () => {
		const properties = compositeCrossSectionPropertiesSolver.calculate(store);
		console.table(Object.entries(properties).map(([key, value]) => ({
			property: key,
			value,
			unit: CROSS_SECTION_UNITS[key as keyof CrossSectionProperties],
		})));
	},
}

const MAIN_MENU_ITEMS: Array<{ value: ActionNames, label: string }> = [
	{ value: 'import', label: 'Import Project' },
	{ value: 'export', label: 'Export Project' },
	{ value: 'results', label: 'Show Results' },
];

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


function onFileSelect(action: ActionNames) {
	ACTIONS_STRATEGIES[action]();
}

function handleAddNewSection(shapeType: (typeof ADD_ITEMS)[number]['value']) {
	openSectionModal({ shapeType, selectedShapeUID: null }); // it is a brand new data
}


</script>

<template>
	<header class="top-panel">
		<div class="nav-item">
			<button type="button" class="nav-button">
				File
			</button>
			<ul class="nav-menu hidden">
				<li v-for="item in MAIN_MENU_ITEMS" :key="item.value">
					<button type="button" class="nav-menu__item" @click="onFileSelect(item.value)">
						{{ item.label }}
					</button>
				</li>
			</ul>
		</div>

		<div class="nav-item">
			<button type="button" class="nav-button">
				Add
			</button>
			<ul class="nav-menu hidden">
				<li v-for="item in ADD_ITEMS" :key="item.value">
					<button type="button" class="nav-menu__item" @click="handleAddNewSection(item.value)">
						{{ item.label }}
					</button>
				</li>
			</ul>
		</div>
	</header>

	<CreateOrUpdateSectionDataModalWindow />
</template>

<style scoped>
.top-panel {
	flex-shrink: 0;
	height: 50px;
	display: flex;
	align-items: center;
	gap: 0;
	padding: 0;
	overflow: visible;
	background: var(--color-surface-chrome);
	border-bottom: 1px solid var(--color-border-subtle);
}


.nav-item {
	position: relative;
	height: 100%;
	display: flex;
	align-items: center;
}

.nav-item:hover>.nav-button {
	background-color: var(--color-fill);
}

.nav-item:hover>.nav-menu {
	display: block;
}

.nav-button {
	height: 90%;
	padding: 0 16px;
	border: none;
	background-color: transparent;
	color: var(--color-text);
	font-size: 13px;
	font-weight: 600;
	letter-spacing: 0.02em;
	text-transform: uppercase;
	cursor: pointer;
	transition: background-color 0.35s;
}


.nav-menu {
	position: absolute;
	top: 100%;
	left: 0;
	z-index: 20;
	min-width: 180px;
	margin: 0;
	padding: 0;
	list-style: none;
	background-color: var(--color-surface-chrome);
	border: 1px solid var(--color-border-subtle);
	border-radius: 0;
	box-shadow: 0 4px 12px var(--color-shadow);
}

.nav-menu.hidden {
	display: none;
}

.nav-menu__item {
	width: 100%;
	padding: 8px 12px;
	border: none;
	border-radius: 0;
	background-color: transparent;
	color: var(--color-text);
	font-size: 16px;
	text-align: left;
	cursor: pointer;
	transition: background-color 0.35s;
}

.nav-menu__item:hover {
	background-color: var(--color-fill);
}
</style>
