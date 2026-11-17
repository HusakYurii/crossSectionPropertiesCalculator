<script setup lang="ts">
import { computed } from 'vue';
import type { CustomShapeGeometry } from '../../interfaces/beams/CustomShape.types';
import { DEFAULT_FEM_MESH_OPTIONS } from '../../interfaces/FEMMeshOptions';
import { FEM_OPTION_FIELDS } from '../../components/forms/customShape/fields';

const props = defineProps<{
	geometry: CustomShapeGeometry;
}>();

const rows = computed(() => {
	const options = { ...DEFAULT_FEM_MESH_OPTIONS, ...props.geometry.femOptions };
	return FEM_OPTION_FIELDS.map(field => ({
		label: field.label,
		value: options[field.key],
		defaultValue: DEFAULT_FEM_MESH_OPTIONS[field.key],
		unit: field.unit,
	}));
});
</script>

<template>
	<table class="report-table">
		<thead>
			<tr>
				<th>Mesh setting</th>
				<th>Value</th>
				<th>Default</th>
				<th>Unit</th>
			</tr>
		</thead>
		<tbody>
			<tr v-for="row in rows" :key="row.label">
				<td>{{ row.label }}</td>
				<td>{{ row.value }}</td>
				<td>{{ row.defaultValue }}</td>
				<td>{{ row.unit }}</td>
			</tr>
		</tbody>
	</table>
</template>
