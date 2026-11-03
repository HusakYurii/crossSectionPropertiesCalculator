<script setup lang="ts">
import { computed } from 'vue';
import { SHAPE_TYPES, type Geometry } from '../interfaces/beams/common.types';
import { SHAPE_FIELDS } from '../components/top/forms/fields/shapeFields';

const props = defineProps<{
	geometry: Geometry;
}>();

const rows = computed(() => {
	const values = props.geometry as unknown as Record<string, number>;
	const fields = (SHAPE_FIELDS[props.geometry.type] ?? []).map(field => ({
		label: field.label,
		value: values[field.key],
		unit: field.unit,
	}));
	if (props.geometry.type === SHAPE_TYPES.CUSTOM_SHAPE) {
		return fields;
	}
	return [{ label: 'Rotation', value: props.geometry.rotation, unit: 'deg' }, ...fields];
});
</script>

<template>
	<p v-if="rows.length === 0" class="parameters-empty">No parameters</p>
	<table v-else class="report-table">
		<thead>
			<tr>
				<th>Parameter</th>
				<th>Value</th>
				<th>Unit</th>
			</tr>
		</thead>
		<tbody>
			<tr v-for="row in rows" :key="row.label">
				<td>{{ row.label }}</td>
				<td>{{ row.value }}</td>
				<td>{{ row.unit }}</td>
			</tr>
		</tbody>
	</table>
</template>

<style scoped>
.parameters-empty {
	margin: 0;
	font-size: 12px;
}
</style>
