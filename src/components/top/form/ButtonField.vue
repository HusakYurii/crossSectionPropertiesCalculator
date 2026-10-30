<script setup lang="ts">
defineProps<{
	/** the small label above the box, like the other fields */
	label: string;
	/** the text on the button inside the box */
	buttonText: string;
	/** aria-label of the "?" next to the label */
	infoLabel?: string;
}>();

const emit = defineEmits<{
	click: [];
	info: [];
}>();
</script>

<template>
	<div class="field">
		<span class="field__label">
			{{ label }}
			<span class="field__option">
				<button type="button" class="field__info-btn" :aria-label="infoLabel ?? `${label} info`"
					@click="emit('info')">?</button>
			</span>
		</span>
		<span class="field__input">
			<button type="button" class="field__button" @click="emit('click')">{{ buttonText }}</button>
		</span>
	</div>
</template>

<style scoped>
/* the same box model as IsNegativeField / SectionField, so a field of any kind lines up with the others */
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
	border: 1px solid var(--color-border-subtle);
	border-radius: 5px;
	overflow: hidden;
	background: var(--color-surface-canvas);
}

/* the same light gray as the other buttons in the project (Clear, Reset); it fills the frame above */
.field__button {
	flex: 1;
	min-width: 0;
	border: none;
	background: var(--color-fill);
	height: 24px;
	padding: 0 6px;
	font-size: 11.7px;
	color: var(--color-text);
	white-space: nowrap;
	outline: none;
	cursor: pointer;
}

.field__button:hover {
	background: var(--color-fill-hover);
}
</style>
