<script setup lang="ts">
import { CROSS_SECTION_UNITS, type CrossSectionProperties } from '../../../interfaces/sectionProperties';

/**
 * Create a separate store to store solvers results which are CrossSectionProperties for a current section
 * Move SectionPropertiesTable to be in each SectionForm as a slot so a section form can pass in calculated CrossSectionProperties 
 * Create a solver and move all math there
 */

const props = defineProps<{
	properties?: CrossSectionProperties;
}>();

const ROWS: { key: keyof CrossSectionProperties; notation: string; label: string }[] = [
	{ key: 'A', notation: 'A', label: 'Area' },
	{ key: 'centroid_x', notation: 'Cx', label: 'Centroid' },
	{ key: 'centroid_y', notation: 'Cy', label: 'Centroid' },
	{ key: 'Ix', notation: 'Ix', label: 'Moment of inertia' },
	{ key: 'Iy', notation: 'Iy', label: 'Moment of inertia' },
	{ key: 'Ixy', notation: 'Ixy', label: 'Product moment of inertia' },
	{ key: 'theta_p_deg', notation: 'θp', label: 'Principal axis angle' },
	{ key: 'I_u', notation: 'I_u', label: 'Max principal inertia' },
	{ key: 'I_v', notation: 'I_v', label: 'Min principal inertia' },
	{ key: 'Ip', notation: 'Ip', label: 'Polar moment of inertia' },
	{ key: 'rx', notation: 'rx', label: 'Radius of gyration' },
	{ key: 'ry', notation: 'ry', label: 'Radius of gyration' },
	{ key: 'r_u', notation: 'r_u', label: 'Max principal radius of gyration' },
	{ key: 'r_v', notation: 'r_v', label: 'Min principal radius of gyration' },
	{ key: 'Wx_top', notation: 'Wx_top', label: 'Section modulus top' },
	{ key: 'Wx_bot', notation: 'Wx_bot', label: 'Section modulus bottom' },
	{ key: 'Wy_rt', notation: 'Wy_rt', label: 'Section modulus right' },
	{ key: 'Wy_lf', notation: 'Wy_lf', label: 'Section modulus left' },
];

function valueFor(key: keyof CrossSectionProperties) {
	return props.properties?.[key] ?? '—';
}

function unitFor(key: keyof CrossSectionProperties) {
	return CROSS_SECTION_UNITS[key];
}
</script>

<template>
	<div class="properties-table-wrapper">
		<table class="properties-table">
			<thead>
				<tr>
					<th>Property</th>
					<th></th>
					<th>Value</th>
					<th>Unit</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="row in ROWS" :key="row.key">
					<td>{{ row.label }}</td>
					<td>{{ row.notation }}</td>
					<td>{{ valueFor(row.key) }}</td>
					<td>{{ unitFor(row.key) }}</td>
				</tr>
			</tbody>
		</table>
	</div>

</template>

<style scoped>
.properties-table-wrapper {
	overflow-y: scroll;
}

.properties-table {
	width: 100%;
	table-layout: fixed;
	border-collapse: collapse;
	font-size: 12px;
	color: var(--color-text);
}

.properties-table th,
.properties-table td {
	padding: 3px 8px;
	border-bottom: 1px solid var(--color-border-subtle);
	text-align: left;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.properties-table th:first-child,
.properties-table td:first-child {
	width: max(220px, 25%);
}

.properties-table th:last-child,
.properties-table td:last-child {
	width: 15%;
}

.properties-table th {
	opacity: 0.6;
	font-weight: 500;
}
</style>
