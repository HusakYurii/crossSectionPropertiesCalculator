<script setup lang="ts">
import { store } from '../store/store';
import { compositeCrossSectionPropertiesSolver } from '../solvers/CompositeCrossSectionPropertiesSolver';
import { SHAPE_TYPES } from '../interfaces/beams/common.types';
import type { CustomShapeGeometry } from '../interfaces/beams/CustomShape.types';
import { FEM_SHAPE_TYPES, SHAPE_LABELS } from '../interfaces/beams/shapeLabels';
import SectionPropertiesTable from '../components/top/forms/SectionPropertiesTable.vue';
import ReportSectionCanvas from './ReportSectionCanvas.vue';
import ReportShapeCanvas from './ReportShapeCanvas.vue';
import ShapeParametersTable from './ShapeParametersTable.vue';
import FemSettingsTable from './FemSettingsTable.vue';
import type { CrossSectionProperties } from '../interfaces/sectionProperties';
import type { ReportSnapshot } from './reportSnapshot';

const props = defineProps<{
	snapshot: ReportSnapshot | null;
}>();

// same order as the left panel
const uids = props.snapshot
	? Object.keys(store.geometry).filter(uid => store.crossSectionProperties[uid] && store.geometryExtra[uid] && store.crossSectionPolygon[uid])
	: [];
const composite = props.snapshot ? compositeCrossSectionPropertiesSolver.calculate(store) : null;
const createdAt = props.snapshot ? new Date(props.snapshot.createdAt) : null;

if (createdAt) {
	document.title = 'Cross section report – ' + createdAt.toLocaleDateString();
}

const isFem = (uid: string) => FEM_SHAPE_TYPES.has(store.geometry[uid].type);
const solverOf = (uid: string) => (isFem(uid) ? 'FEM' : 'Simple');
const typeLabelOf = (uid: string) => SHAPE_LABELS[store.geometry[uid].type];
const rotationOf = (uid: string) => store.geometry[uid].rotation ?? 0;
// display only: the tube strategies do not round, the composite solver does (PRECISION = 2)
const round = (value: number) => parseFloat(value.toFixed(2)) + 0;
const propertiesOf = (uid: string) => Object.fromEntries(Object.entries(store.crossSectionProperties[uid]).map(([key, value]) => [key, round(value)])) as unknown as CrossSectionProperties;
const areaOf = (uid: string) => (store.geometry[uid].isNegative ? '−' : '') + round(store.crossSectionProperties[uid].A);
const isCustom = (uid: string) => store.geometry[uid].type === SHAPE_TYPES.CUSTOM_SHAPE;

const print = () => window.print();
</script>

<template>
	<p v-if="!snapshot" class="report__missing">
		Report data not found. Open the report again from the editor (File → Show Results).
	</p>
	<div v-else class="report">
		<div class="report__toolbar no-print">
			<button type="button" class="report__print" @click="print">Print / Save as PDF</button>
		</div>

		<main class="report__sheet">
			<header class="report__header">
				<h1>Cross section properties report</h1>
				<p>{{ createdAt!.toLocaleString() }} · {{ uids.length }} {{ uids.length === 1 ? 'part' : 'parts' }} · Lengths in mm, angles in deg</p>
			</header>

			<section>
				<h2>1. Whole cross section</h2>
				<ReportSectionCanvas :uids="uids" :composite="composite!" />

				<h3>Composite properties</h3>
				<SectionPropertiesTable v-if="composite!.A > 0" :properties="composite!" :scrollable="false" />
				<p v-else>Composite properties could not be calculated</p>

				<div class="report__parts">
				<h3>Parts</h3>
				<table class="report-table">
					<thead>
						<tr>
							<th>#</th>
							<th>Name</th>
							<th>Type</th>
							<th>Role</th>
							<th>Solver</th>
							<th>A (mm^2)</th>
							<th>x (mm)</th>
							<th>y (mm)</th>
							<th>Rotation (deg)</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="(uid, index) in uids" :key="uid">
							<td>{{ index + 1 }}</td>
							<td>{{ store.geometryExtra[uid].name }}</td>
							<td>{{ typeLabelOf(uid) }}</td>
							<td>{{ store.geometry[uid].isNegative ? 'Negative (hole)' : 'Positive' }}</td>
							<td>{{ solverOf(uid) }}</td>
							<td>{{ areaOf(uid) }}</td>
							<td>{{ round(store.geometryExtra[uid].position.x) }}</td>
							<td>{{ round(store.geometryExtra[uid].position.y) }}</td>
							<td>{{ rotationOf(uid) }}</td>
						</tr>
					</tbody>
				</table>
				</div>
			</section>

			<h2 class="report__parts-title">2. Parts</h2>
			<section v-for="(uid, index) in uids" :key="uid" class="shape-section" :class="{ 'shape-section--fem': isCustom(uid) }">
				<h3>
					2.{{ index + 1 }} {{ store.geometryExtra[uid].name }} — {{ typeLabelOf(uid) }}
					<span v-if="store.geometry[uid].isNegative" class="shape-section__badge">Negative</span>
				</h3>
				<p class="shape-section__meta">
					Position (x, y) {{ round(store.geometryExtra[uid].position.x) }}, {{ round(store.geometryExtra[uid].position.y) }} mm ·
					Rotation {{ rotationOf(uid) }} deg · Solver {{ solverOf(uid) }}
				</p>

				<template v-if="isCustom(uid)">
					<ReportShapeCanvas :uid="uid" :width="680" :height="320" />
					<FemSettingsTable :geometry="store.geometry[uid] as CustomShapeGeometry" />
				</template>
				<div v-else class="shape-section__grid">
					<ReportShapeCanvas :uid="uid" :width="330" :height="260" />
					<ShapeParametersTable :geometry="store.geometry[uid]" />
				</div>

				<SectionPropertiesTable :properties="propertiesOf(uid)" :scrollable="false" />
			</section>
		</main>
	</div>
</template>

<style>
@page {
	size: A4 portrait;
	margin: 14mm 15mm;
}

.report-mode body {
	background: #e9ebef; /* screen: grey desk */
}

.report-mode,
.report-mode * {
	-webkit-print-color-adjust: exact;
	print-color-adjust: exact;
}

@media print {
	.report-mode body {
		background: #fff;
	}
}

/* 8: the one table look for every table of the report */
.report-mode .report-table {
	width: 100%;
	border-collapse: collapse;
	font-size: 12px;
	color: var(--color-text);
}

.report-mode .report-table th,
.report-mode .report-table td {
	padding: 3px 8px;
	border-bottom: 1px solid var(--color-border-subtle);
	text-align: left;
}

.report-mode .report-table th {
	opacity: 0.6;
	font-weight: 500;
}

.report-mode .report-table thead {
	display: table-header-group;
}

.report-mode .report-table tr {
	break-inside: avoid;
}
</style>

<style scoped>
.report__missing {
	margin: 0;
	padding: 80px 24px;
	text-align: center;
}

.report__toolbar {
	display: flex;
	justify-content: center;
	padding: 12px;
}

.report__print {
	padding: 6px 14px;
	border: 1px solid var(--color-border-subtle);
	background: var(--color-surface-chrome);
	color: var(--color-text);
	cursor: pointer;
}

.report__print:hover {
	background: var(--color-fill-hover);
}

.report__sheet {
	width: 210mm;
	margin: 24px auto;
	padding: 15mm;
	background: #fff;
	box-shadow: 0 2px 12px var(--color-shadow);
	font-size: 12px;
}

.report__header h1 {
	margin: 0 0 4px;
	font-size: 22px;
}

.report__header p {
	margin: 0 0 16px;
}

.report__sheet :deep(.report-figure) {
	display: block;
	width: 100%;
	height: auto;
	border: 1px solid var(--color-border-subtle);
}

h2,
h3 {
	break-after: avoid;
}

h2 {
	margin: 16px 0 8px;
	font-size: 16px;
}

h3 {
	margin: 14px 0 6px;
	font-size: 14px;
}

.report__parts-title {
	break-before: page;
}

.report__parts {
	break-inside: avoid;
}

.shape-section {
	break-inside: avoid;
	margin-top: 10mm;
}

.shape-section--fem {
	margin-top: 0;
	break-before: page;
}

.report__parts-title + .shape-section--fem {
	break-before: auto;
}

.shape-section--fem > * {
	break-inside: avoid;
}

.shape-section--fem > * + * {
	margin-top: 8px;
}

/* the first column of the properties table is wide enough for the longest label */
.report__sheet :deep(.properties-table th:first-child),
.report__sheet :deep(.properties-table td:first-child) {
	width: 260px;
}

.shape-section__badge {
	margin-left: 8px;
	padding: 1px 6px;
	background: var(--color-fill);
	font-size: 11px;
	font-weight: 600;
}

.shape-section__meta {
	margin: 0 0 8px;
}

.shape-section__grid {
	display: grid;
	grid-template-columns: 330px 1fr;
	align-items: start;
	gap: 16px;
	margin-bottom: 8px;
}

/* last, so these win over the screen rules above */
@media print {
	.no-print {
		display: none;
	}

	.report__sheet {
		width: auto;
		margin: 0;
		padding: 0;
		box-shadow: none;
	}
}
</style>
