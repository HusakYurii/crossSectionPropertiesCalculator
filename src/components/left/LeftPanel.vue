<script setup lang="ts">
import { computed } from 'vue';
import { store, appSessionState, setSelectedShapeID, removeGeometryData, removeCrossSectionProperties, removeCrossSectionPolygon, removeCrossSectionMesh, removeGeometryExtraData, setHoveredShapeID, removeShapeSessionState, setGeometryOrder, updateGeometryExtraData } from '../../store/store';
import { history } from '../../store/history';
import { openSectionModal } from '../../store/sectionModal';
import trashIconRaw from '../../svg/trash.svg?raw';
import editIconRaw from '../../svg/edit.svg?raw';
import type { SHAPE_TYPES } from '../../interfaces/beams/common.types';
import { useListItemDrag } from './composables/useListItemDrag';
import { useRenameListItem } from './composables/useRenameListItem';

const geometryList = computed(() => Object.entries(store.geometry));
const geometryExtraData = computed(() => store.geometryExtra);

const { onDragStart, onDragOver, onDrop, onDragEnd, onListDragLeave, isDragging, isDropBefore, isDropAfter } = useListItemDrag({
	getOrder: () => Object.keys(store.geometry),
	onReorder: (order) => {
		setGeometryOrder(order);
		history.commit();
	},
	onDragStart: () => setHoveredShapeID(null),
});

const { draftName, isRenaming, startRename, commitRename, onRenameKeydown, vRenameFocus } = useRenameListItem({
	getName: (uid) => store.geometryExtra[uid]?.name,
	onRename: (uid, name) => {
		updateGeometryExtraData({ uid, data: { name } });
		history.commit();
	},
	// a double-click first sends two clicks, which toggle the selection off again
	onRenameStart: (uid) => setSelectedShapeID(uid),
});

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

</script>

<template>
	<aside class="left-panel">
		<ul class="shape-list" @dragleave="onListDragLeave">
			<li v-for="([uid, shape], index) in geometryList" :key="uid" :id="uid" class="shape-list__item"
				:draggable="!isRenaming(uid)" :class="{
					'shape-list__item--selected': uid === appSessionState.currentSelectedShapeID,
					'shape-list__item--dragging': isDragging(uid),
					'shape-list__item--drop-before': isDropBefore(index),
					'shape-list__item--drop-after': isDropAfter(index),
				}" @click="onSelect(uid)" @mouseenter="onMouseEnter" @mouseleave="onMouseLeave"
				@dragstart="onDragStart($event, uid)" @dragover="onDragOver($event, index)" @drop="onDrop"
				@dragend="onDragEnd">
				<input v-if="isRenaming(uid)" v-rename-focus v-model="draftName"
					class="shape-list__name shape-list__name-input" @keydown="onRenameKeydown"
					@blur="commitRename" @click.stop @dblclick.stop>
				<span v-else class="shape-list__name" @dblclick="startRename(uid)">{{ geometryExtraData[uid].name }}</span>
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
	padding: 4px 10px;
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
	font-size: 14px;
}

.shape-list__name-input {
	font: inherit;
	font-size: 14px;
	color: inherit;
	background: transparent;
	border: 1px solid var(--color-accent);
	padding: 0 2px;
	margin: 0;
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
	width: 28px;
	height: 28px;
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
