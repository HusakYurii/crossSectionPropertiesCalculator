<script setup lang="ts">
import { computed } from 'vue';
import type { Point } from '@/shared/types/geometry';
import { POLYGON_LIMITS } from '@/solvers';
import { roundTo } from '@/shared/math/round';
import { hasModKey } from '@/shared/services/hotkeys/NativeHotKeysService';

// the points are edited in place, the same way the canvas editor edits them
const points = defineModel<Point[]>('points', { required: true });
const selectedIndices = defineModel<number[]>('selectedIndices', { required: true });
const emit = defineEmits<{ clear: []; edit: [] }>();

const hasEnoughPoints = computed(() => points.value.length >= POLYGON_LIMITS.MIN_OPEN_POINTS);

/** typed values are rounded to 0.001 mm once the user commits them (blur / Enter) */
function setCoordinate(point: Point, axis: 'x' | 'y', event: Event) {
	const input = event.target as HTMLInputElement;
	// `|| 0` covers an empty or invalid field and turns -0 into 0
	point[axis] = roundTo(Number(input.value), 3);
	// show the rounded value even when it equals the old one, so the field never keeps "2.7004"
	input.value = String(point[axis]);
	emit('edit');
}

/** swaps a point with its neighbour (-1 up, +1 down); the selection follows the moved point */
function movePoint(index: number, delta: -1 | 1) {
	const target = index + delta;
	const list = points.value;
	if (target < 0 || target >= list.length) {
		return;
	}

	[list[index], list[target]] = [list[target], list[index]];

	// the selection follows the moved points; always a new array, the canvas watches it shallowly
	selectedIndices.value = selectedIndices.value
		.map((i) => (i === index ? target : i === target ? index : i))
		.sort((a, b) => a - b);
	emit('edit');
}

/** Cmd/Ctrl+click toggles a row, a plain click selects only it */
function selectRow(index: number, event?: MouseEvent) {
	if (event && hasModKey(event)) {
		selectedIndices.value = selectedIndices.value.includes(index)
			? selectedIndices.value.filter((i) => i !== index)
			: [...selectedIndices.value, index].sort((a, b) => a - b);
		return;
	}
	selectedIndices.value = [index];
}

/** focusing an input of a selected row keeps the group, so it can be edited without losing it */
function focusRow(index: number) {
	if (!selectedIndices.value.includes(index)) {
		selectedIndices.value = [index];
	}
}

function removePoint(index: number) {
	points.value.splice(index, 1);
	selectedIndices.value = selectedIndices.value
		.filter((i) => i !== index)
		.map((i) => (i > index ? i - 1 : i));
	emit('edit');
}
</script>

<template>
	<div class="custom-shape__list-header">
		<span v-if="points.length === 0" class="custom-shape__list-empty">
			No points yet. Click on the canvas to add the first one.
		</span>
		<span v-else>Points: {{ points.length }}</span>
		<button type="button" class="custom-shape__clear" :disabled="points.length === 0"
			@click="emit('clear')">Clear</button>
	</div>

	<p v-if="points.length > 0 && !hasEnoughPoints" class="custom-shape__empty">
		A shape needs at least {{ POLYGON_LIMITS.MIN_OPEN_POINTS }} points.
	</p>

	<!-- data-own-enter: the value is committed on change, so Enter applies it instead of confirming the dialog -->
	<ol class="custom-shape__list">
		<li v-for="(point, index) in points" :key="index" class="custom-shape__row"
			:class="{ 'custom-shape__row--selected': selectedIndices.includes(index) }" @click="selectRow(index, $event)">
			<span class="custom-shape__index">{{ index + 1 }}</span>
			<label class="custom-shape__coord">
				<span>x</span>
				<input :value="point.x" type="number" step="any" data-own-enter @click.stop @focus="focusRow(index)"
					@change="setCoordinate(point, 'x', $event)" />
			</label>
			<label class="custom-shape__coord">
				<span>y</span>
				<input :value="point.y" type="number" step="any" data-own-enter @click.stop @focus="focusRow(index)"
					@change="setCoordinate(point, 'y', $event)" />
			</label>
			<span class="custom-shape__move">
				<button type="button" class="custom-shape__move-btn" aria-label="Move point up"
					:disabled="index === 0" @click.stop="movePoint(index, -1)">▲</button>
				<button type="button" class="custom-shape__move-btn" aria-label="Move point down"
					:disabled="index === points.length - 1"
					@click.stop="movePoint(index, 1)">▼</button>
			</span>
			<button type="button" class="custom-shape__remove" aria-label="Remove point"
				@click.stop="removePoint(index)">✕</button>
		</li>
	</ol>
</template>

<style scoped>
.custom-shape__list-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
	/* room for the two-line "No points yet" hint, so the header (and the Clear button) never changes size */
	height: 30px;
	flex-shrink: 0;
	font-size: 10.8px;
	font-weight: 700;
	letter-spacing: 0.04em;
	text-transform: uppercase;
	opacity: 0.8;
}

/* the sentence is a hint, not a label, so it drops the uppercase and gets the same quiet look as the other hints */
.custom-shape__list-empty {
	font-size: 11px;
	font-weight: 400;
	letter-spacing: normal;
	text-transform: none;
	line-height: 1.3;
	opacity: 0.75;
}

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

.custom-shape__clear:disabled {
	opacity: 0.4;
	cursor: not-allowed;
}

.custom-shape__list {
	flex: 1;
	min-height: 0;
	margin: 0;
	padding: 0;
	overflow-y: auto;
	list-style: none;
}

.custom-shape__row {
	display: grid;
	grid-template-columns: 22px 1fr 1fr 14px 20px;
	align-items: center;
	gap: 6px;
	padding: 3px 4px;
	border-radius: 5px;
	cursor: pointer;
}

.custom-shape__row--selected {
	background: var(--color-point-selected);
}

.custom-shape__index {
	font-size: 11px;
	font-weight: 700;
	opacity: 0.7;
	text-align: center;
}

.custom-shape__coord {
	display: flex;
	align-items: center;
	min-width: 0;
	gap: 4px;
	padding: 0 6px;
	border: 1px solid var(--color-border-subtle);
	border-radius: 5px;
	background: var(--color-surface-canvas);
	font-size: 10.8px;
}

.custom-shape__coord input {
	flex: 1;
	min-width: 0;
	height: 24px;
	border: none;
	background: transparent;
	font-size: 11.7px;
	color: var(--color-text);
	outline: none;
}

.custom-shape__move {
	display: flex;
	flex-direction: column;
	gap: 1px;
}

.custom-shape__move-btn {
	width: 14px;
	height: 11px;
	padding: 0;
	border: none;
	border-radius: 3px;
	background: var(--color-fill);
	color: var(--color-text);
	font-size: 6px;
	line-height: 1;
	cursor: pointer;
}

.custom-shape__move-btn:hover:not(:disabled) {
	background: var(--color-fill-strong);
}

.custom-shape__move-btn:disabled {
	opacity: 0.25;
	cursor: default;
}

.custom-shape__remove {
	width: 18px;
	height: 18px;
	padding: 0;
	border: none;
	border-radius: 50%;
	background: var(--color-fill);
	color: var(--color-text);
	font-size: 9px;
	line-height: 1;
	cursor: pointer;
}

.custom-shape__remove:hover {
	background: var(--color-fill-hover);
}

.custom-shape__empty {
	margin: 0;
	font-size: 11px;
	opacity: 0.6;
}
</style>
