<script setup lang="ts">
const model = defineModel<boolean>({ required: true });

function openNegativeInfo() {
	// TODO: open a modal or slide-in panel with negative-area info
}

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
					@click="openNegativeInfo">?</button>
			</span>
		</span>
		<span class="field__input">
			<select :value="model ? 'negative' : 'positive'" @change="onChange">
				<option value="positive">Positive</option>
				<option value="negative">Negative</option>
			</select>
		</span>
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

.field__input {
	display: flex;
	align-items: center;
	gap: 5px;
	border: 1px solid var(--color-border-subtle);
	border-radius: 5px;
	padding: 0 6px;
	background: var(--color-surface-canvas);
}

.field__input select {
	flex: 1;
	min-width: 0;
	border: none;
	background: transparent;
	height: 24px;
	font-size: 11.7px;
	color: var(--color-text);
	outline: none;
	cursor: pointer;
}
</style>
