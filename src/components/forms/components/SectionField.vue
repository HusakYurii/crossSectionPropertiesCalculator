<script setup lang="ts">
withDefaults(defineProps<{
	label: string;
	unit: string;
	disabled?: boolean;
}>(), {
	disabled: false,
});

const model = defineModel<number>({ required: true });
</script>

<template>
	<label class="field">
		<span class="field__label">
			<span class="field__text" :title="label">{{ label }}</span>
			<span class="field__option">
				<slot name="option" />
			</span>
		</span>
		<span class="field__input" :class="{ 'field__input--disabled': disabled }">
			<input v-model.number="model" type="number" step="any" :disabled="disabled" />
			<span class="field__unit">{{ unit }}</span>
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
	white-space: nowrap;
}

/* the text shrinks with an ellipsis instead of wrapping or spilling into the neighbouring field */
.field__text {
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
}

.field__option {
	display: inline-flex;
	align-items: center;
	flex-shrink: 0;
}

.field__option:empty {
	display: none;
}

.field__option :slotted(input[type='checkbox']) {
	margin: 0;
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

.field__input input {
	flex: 1;
	min-width: 0;
	border: none;
	background: transparent;
	height: 24px;
	font-size: 11.7px;
	color: var(--color-text);
	outline: none;
}

.field__input--disabled {
	opacity: 0.5;
}

.field__unit {
	font-size: 9.9px;
	color: var(--color-text);
	opacity: 0.6;
}
</style>
