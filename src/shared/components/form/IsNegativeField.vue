<script setup lang="ts">
import StyledSelectWrapper from './StyledSelectWrapper.vue';

const model = defineModel<boolean>({ required: true });
const emit = defineEmits<{ info: [] }>();

function onChange(event: Event) {
	model.value = (event.target as HTMLSelectElement).value === 'negative';
}
</script>

<template>
	<label class="field">
		<span class="field__label">
			Shape sign
			<span class="field__option">
				<button type="button" class="field__info-btn" aria-label="Negative area info"
					@click="emit('info')">?</button>
			</span>
		</span>
		<StyledSelectWrapper class="field__input">
			<select :value="model ? 'negative' : 'positive'" @change="onChange">
				<option value="positive">Positive</option>
				<option value="negative">Negative</option>
			</select>
		</StyledSelectWrapper>
	</label>
</template>

<style scoped>
.field {
	display: flex;
	flex-direction: column;
	min-width: 0;
	gap: 3px;
	font-size: 10.8px;
	color: var(--color-text);
}

.field__label {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 6px;
}

.field__option {
	display: inline-flex;
	align-items: center;
}

.field__info-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 12px;
	height: 12px;
	padding: 0;
	border: none;
	border-radius: 50%;
	background: var(--color-fill);
	color: var(--color-text);
	font-size: 8px;
	font-weight: 700;
	line-height: 1;
	cursor: pointer;
}

.field__info-btn:hover {
	background: var(--color-fill-hover);
}

/* the select draws its own box; match the 26 px height and 5 px radius of the other form inputs */
.field__input select {
	flex: 1;
	min-width: 0;
	height: 26px;
	border-radius: 5px;
}

@supports (appearance: base-select) {
	.field__input select::picker(select) {
		border-radius: 5px;
	}
}
</style>
