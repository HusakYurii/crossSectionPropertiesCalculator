<script setup lang="ts">
import { watch, ref, onMounted, onUnmounted } from 'vue';
import { store, appSessionState, updateGeometryExtraData, type GeometryDataExtra } from '../../store/store';
import { useDebounce } from '../../composables/useDebounce';
import { history } from '../../store/history';

const empty: GeometryDataExtra = {
	name: '',
	position: { x: 0, y: 0 }
}

const data = ref<GeometryDataExtra>(empty);
const hasSelectedID = ref(false);
// the shape can be deleted (or undone away) while a write waits, and the write must not throw then
const [updateData, _, flushData] = useDebounce((payload: { uid: string; data: Partial<GeometryDataExtra> }) => {
	if (store.geometryExtra[payload.uid]) {
		updateGeometryExtraData(payload);
	}
}, 500);

// undo and redo save what is still waiting first
const stopBeforeCommit = history.onBeforeCommit(flushData);

// A pending write must land before the canvas reads the shape's position for a drag. The canvas
// handler runs on mousedown, before the input's change event, so flush in the capture phase.
onMounted(() => window.addEventListener('mousedown', flushData, true));
onUnmounted(() => {
	stopBeforeCommit();
	window.removeEventListener('mousedown', flushData, true);
});

const handleFormChange = () => {
	flushData();
	history.commit();
	// a field that was left blank (and so was not written) shows the stored value again
	const stored = store.geometryExtra[appSessionState.currentSelectedShapeID as string];
	if (stored) {
		data.value = { name: stored.name, position: { ...stored.position } };
	}
}

watch(() => store.geometryExtra[appSessionState.currentSelectedShapeID as string], (newData: GeometryDataExtra) => {
	hasSelectedID.value = newData !== undefined;
	if (newData !== undefined) {
		const { name, position } = newData;
		data.value = {
			name,
			position: { ...position }
		}
	}
}, { deep: true });

const handleFormInput = (event: InputEvent) => {
	if (!appSessionState.currentSelectedShapeID) {
		return;
	}

	if (!(event.currentTarget instanceof HTMLFormElement)) {
		return
	}
	const formData = new FormData(event.currentTarget as HTMLFormElement);
	const x = parseFloat(formData.get('positionX') as string);
	const y = parseFloat(formData.get('positionY') as string);
	const current = store.geometryExtra[appSessionState.currentSelectedShapeID];
	if (!current) {
		return;
	}
	// an empty number input parses to NaN, which must not become the position (it would export as null),
	// so each axis is written only when it is a number and keeps its stored value otherwise
	const data: Partial<GeometryDataExtra> = {
		name: formData.get('name') as string,
		position: {
			x: Number.isFinite(x) ? x : current.position.x,
			y: Number.isFinite(y) ? y : current.position.y,
		},
	};

	updateData({
		uid: appSessionState.currentSelectedShapeID,
		data
	})
}

</script>

<template>
	<aside class="right-panel">
		<form v-if="hasSelectedID" class="shape-form" @input="handleFormInput" @change="handleFormChange" @submit.prevent>
			<label class="shape-form__label" for="shape-name">Name:</label>
			<div class="shape-form__row">
				<input id="shape-name" :value="data.name" type="text" name="name" class="shape-form__input" />
			</div>

			<label class="shape-form__label">Position:</label>
			<div class="shape-form__row shape-form__row--pair">
				<div class="shape-form__input-wrap">
					<span class="shape-form__hint">X</span>
					<input :value="data.position.x" type="number" step="any" name="positionX"
						class="shape-form__input shape-form__input--hinted" aria-label="Position X" />
					<span class="shape-form__unit">mm</span>
				</div>
				<div class="shape-form__input-wrap">
					<span class="shape-form__hint">Y</span>
					<input :value="data.position.y" type="number" step="any" name="positionY"
						class="shape-form__input shape-form__input--hinted" aria-label="Position Y" />
					<span class="shape-form__unit">mm</span>
				</div>
			</div>


		</form>
	</aside>
</template>

<style scoped>
.right-panel {
	height: 100%;
	width: 100%;
	min-width: 0;
	min-height: 0;
	overflow: auto;
	background: var(--color-surface-sidebar);
	border-left: 1px solid var(--color-border-subtle);
}

.shape-form {
	display: grid;
	grid-template-columns: 25% 1fr;
	align-items: center;
	column-gap: 10px;
	row-gap: 10px;
	padding: 12px;
	font-size: 16px;
	color: var(--color-text);
}

.shape-form__label {
	font-weight: 400;
	white-space: nowrap;
}

.shape-form__row {
	min-width: 0;
}

.shape-form__row--pair {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 8px;
}

.shape-form__input-wrap {
	position: relative;
	min-width: 0;
}

.shape-form__hint {
	position: absolute;
	top: 50%;
	left: 8px;
	transform: translateY(-50%);
	font-weight: 400;
	font-size: 11px;
	color: var(--color-text);
	opacity: 0.4;
	pointer-events: none;
	user-select: none;
}

.shape-form__input {
	width: 100%;
	min-width: 0;
	height: 28px;
	padding: 0 10px;
	border: 1px solid var(--color-border-subtle);
	border-radius: 6px;
	background: var(--color-surface-canvas);
	color: var(--color-text);
	font-size: 12px;
	outline: none;
	box-sizing: border-box;
	text-align: right;
}

.shape-form__input--hinted {
	padding-left: 26px;
	padding-right: 22px;
}

.shape-form__unit {
	position: absolute;
	top: 50%;
	right: 8px;
	transform: translateY(-50%);
	font-weight: 400;
	font-size: 9.9px;
	color: var(--color-text);
	opacity: 0.6;
	pointer-events: none;
	user-select: none;
}

#shape-name {
	text-align: left;
}
</style>
