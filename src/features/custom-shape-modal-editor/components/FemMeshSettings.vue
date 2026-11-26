<script setup lang="ts">
import { DEFAULT_FEM_MESH_OPTIONS, type FEMMeshOptions } from '@/shared/types/femMeshOptions';
import SectionField from '@/shared/components/form/SectionField.vue';
import { FEM_OPTION_FIELDS } from '@/shared/shapes';

const options = defineModel<Required<FEMMeshOptions>>('options', { required: true });
const emit = defineEmits<{ edit: [] }>();

function resetFemOptions() {
	options.value = { ...DEFAULT_FEM_MESH_OPTIONS };
	emit('edit');
}
</script>

<template>
	<details class="custom-shape__mesh">
		<summary>Mesh settings</summary>
		<!-- the native change event bubbles up from a field on blur / Enter, so one listener covers all fields -->
		<div class="custom-shape__mesh-fields" @change="emit('edit')">
			<SectionField v-for="field in FEM_OPTION_FIELDS" :key="field.key" v-model="options[field.key]" :label="field.label" :unit="field.unit" />
		</div>
		<div class="custom-shape__mesh-actions">
			<button type="button" class="custom-shape__clear" @click="resetFemOptions">Reset</button>
		</div>
	</details>
</template>

<style scoped>
.custom-shape__clear {
	flex-shrink: 0;
	padding: 2px 8px;
	border: none;
	border-radius: 5px;
	background: var(--color-fill);
	color: var(--color-text);
	font-size: 10.8px;
	cursor: pointer;
}

.custom-shape__mesh {
	font-size: 10.8px;
}

.custom-shape__mesh summary {
	font-weight: 700;
	letter-spacing: 0.04em;
	text-transform: uppercase;
	opacity: 0.8;
	cursor: pointer;
	user-select: none;
}

.custom-shape__mesh-actions {
	display: flex;
	justify-content: flex-end;
}

.custom-shape__mesh-fields {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 8px;
	margin: 8px 0;
}
</style>
