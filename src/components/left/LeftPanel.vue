<script setup lang="ts">
import { computed, ref } from 'vue';
import { store, appSessionState, setSelectedShapeID, removeGeometryData, removeCrossSectionProperties, removeCrossSectionPolygon, removeCrossSectionMesh, removeGeometryExtraData, setHoveredShapeID, removeShapeSessionState, setGeometryOrder } from '../../store/store';
import { history } from '../../store/history';
import { openSectionModal } from '../../store/sectionModal';
import trashIconRaw from '../../svg/trash.svg?raw';
import editIconRaw from '../../svg/edit.svg?raw';
import type { SHAPE_TYPES } from '../../interfaces/beams/common.types';

const geometryList = computed(() => Object.entries(store.geometry));
const geometryExtraData = computed(() => store.geometryExtra);

const draggedUid = ref<string | null>(null);
// insert position 0..n in the full list (the dragged row included), null when the pointer is outside the list
const dropIndex = ref<number | null>(null);

function onSelect(uid: string) {
	if (appSessionState.currentSelectedShapeID === uid) {
		setSelectedShapeID(null);
	}
	else {
		setSelectedShapeID(uid);
	}

}

function onEdit(uid: string, shapeType: keyof typeof SHAPE_TYPES) {
	setSelectedShapeID(uid);
	openSectionModal({ shapeType, selectedShapeUID: uid });
}

function onDelete(uid: string) {
	if (appSessionState.currentSelectedShapeID === uid) {
		setSelectedShapeID(null);
	}
	if (appSessionState.currentHoveredShapeID === uid) {
		setHoveredShapeID(null);
	}
	removeGeometryData(uid);
	removeCrossSectionPolygon(uid);
	removeCrossSectionMesh(uid);
	removeCrossSectionProperties(uid);
	removeGeometryExtraData(uid);
	removeShapeSessionState(uid);
	history.commit();
}

function onMouseEnter(event: MouseEvent) {
	setHoveredShapeID((event.target as HTMLElement).id);
}

function onMouseLeave(_event: MouseEvent) {
	setHoveredShapeID(null);
}

function onDragStart(event: DragEvent, uid: string) {
	draggedUid.value = uid;
	// Firefox does not start a drag without data; a private type, because text/plain could be dropped into a text input
	event.dataTransfer?.setData('application/x-shape-uid', uid);
	if (event.dataTransfer) {
		event.dataTransfer.effectAllowed = 'move';
	}
	setHoveredShapeID(null);
}

function onDragOver(event: DragEvent, index: number) {
	if (draggedUid.value === null) {
		return;
	}
	event.preventDefault();
	const row = event.currentTarget as HTMLElement;
	const rect = row.getBoundingClientRect();
	dropIndex.value = event.clientY < rect.top + rect.height / 2 ? index : index + 1;
}

function onDrop(event: DragEvent) {
	if (draggedUid.value === null || dropIndex.value === null) {
		return;
	}
	event.preventDefault();
	const uid = draggedUid.value;
	const slot = dropIndex.value;
	// dragend may not fire once the row has moved in the DOM, so clear the state here too
	onDragEnd();
	const order = Object.keys(store.geometry);
	const from = order.indexOf(uid);
	if (from === -1) {
		return;
	}
	// the dragged row is removed first, so a position after it moves up by one
	const to = slot > from ? slot - 1 : slot;
	if (to === from) {
		return;
	}
	order.splice(from, 1);
	order.splice(to, 0, uid);
	setGeometryOrder(order);
	history.commit();
}

function onDragEnd() {
	draggedUid.value = null;
	dropIndex.value = null;
}

function onListDragLeave(event: DragEvent) {
	// relatedTarget can be null in Safari between rows, so compare the pointer with the list bounds instead
	const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
	const { clientX, clientY } = event;
	// (0, 0) is what browsers report when the pointer left the window
	const leftWindow = clientX === 0 && clientY === 0;
	const outside = clientX < rect.left || clientX >= rect.right || clientY < rect.top || clientY >= rect.bottom;
	if (leftWindow || outside) {
		dropIndex.value = null;
	}
}

// the insertion line is hidden on the two slots around the dragged row, where a drop does nothing
function isDropSlot(slot: number) {
	if (dropIndex.value !== slot || draggedUid.value === null) {
		return false;
	}
	const from = geometryList.value.findIndex(([uid]) => uid === draggedUid.value);
	return slot !== from && slot !== from + 1;
}

</script>

<template>
	<aside class="left-panel">
		<ul class="shape-list" @dragleave="onListDragLeave">
			<li v-for="([uid, shape], index) in geometryList" :key="uid" :id="uid" class="shape-list__item"
				draggable="true" :class="{
					'shape-list__item--selected': uid === appSessionState.currentSelectedShapeID,
					'shape-list__item--dragging': uid === draggedUid,
					'shape-list__item--drop-before': isDropSlot(index),
					'shape-list__item--drop-after': isDropSlot(index + 1) && index === geometryList.length - 1,
				}" @click="onSelect(uid)" @mouseenter="onMouseEnter" @mouseleave="onMouseLeave"
				@dragstart="onDragStart($event, uid)" @dragover="onDragOver($event, index)" @drop="onDrop"
				@dragend="onDragEnd">
				<span class="shape-list__name">{{ geometryExtraData[uid].name }}</span>
				<span class="shape-list__actions">
					<button type="button" class="icon-button icon-button--edit" aria-label="Edit shape"
						@click.stop="onEdit(uid, shape.type)">
						<span class="icon-button__icon" v-html="editIconRaw"></span>
					</button>
					<button type="button" class="icon-button icon-button--delete" aria-label="Delete shape"
						@click.stop="onDelete(uid)">
						<span class="icon-button__icon" v-html="trashIconRaw"></span>
					</button>
				</span>
			</li>
		</ul>
	</aside>
</template>

<style scoped>
.left-panel {
	height: 100%;
	width: 100%;
	min-width: 0;
	min-height: 0;
	overflow: auto;
	background: var(--color-surface-sidebar);
	border-right: 1px solid var(--color-border-subtle);
}

.shape-list {
	margin: 0;
	padding: 0;
	list-style: none;
}

.shape-list__item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
	padding: 6px 10px;
	border-bottom: 1px solid var(--color-border-subtle);
	color: var(--color-text);
	font-size: 13px;
	cursor: default;
	position: relative;
}

.shape-list__item:hover {
	background: var(--color-fill-faint);
}

.shape-list__item--selected {
	background: var(--color-accent-selected);
}

.shape-list__item--selected:hover {
	background: var(--color-accent-selected-hover);
}

.shape-list__item--dragging {
	opacity: 0.4;
}

.shape-list__item--drop-before::after,
.shape-list__item--drop-after::after {
	content: '';
	position: absolute;
	left: 0;
	right: 0;
	height: 2px;
	background: var(--color-accent);
	pointer-events: none;
}

.shape-list__item--drop-before::after {
	top: -1px;
}

.shape-list__item:first-child.shape-list__item--drop-before::after {
	top: 0;
}

.shape-list__item--drop-after::after {
	bottom: -1px;
}

.shape-list__name {
	min-width: 0;
	flex: 1;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-size: 16px;
}

.shape-list__actions {
	flex-shrink: 0;
	display: flex;
	gap: 4px;
}

.icon-button {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 30px;
	height: 30px;
	border: none;
	border-radius: 0;
	background: transparent;
	cursor: pointer;
}

.icon-button__icon {
	display: block;
	width: 100%;
	height: 100%;
	color: var(--color-text);
}

.icon-button__icon :deep(svg) {
	display: block;
	width: 100%;
	height: 100%;
}

.icon-button__icon :deep(path),
.icon-button__icon :deep(polygon) {
	stroke: currentColor;
}

.icon-button--edit:hover .icon-button__icon {
	color: var(--color-accent);
}

.icon-button--delete:hover .icon-button__icon {
	color: var(--color-danger);
}
</style>
