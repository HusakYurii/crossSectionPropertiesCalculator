<script setup lang="ts">
import { computed } from 'vue';
import { store, appSessionState, setSelectedShapeID, removeGeometryData, removeCrossSectionProperties, removeCrossSectionPolygon, removeCrossSectionMesh, removeGeometryExtraData, setHoveredShapeID, removeShapeSessionState } from '../../store/store';
import { openSectionModal } from '../../store/sectionModal';
import trashIconRaw from '../../svg/trash.svg?raw';
import editIconRaw from '../../svg/edit.svg?raw';
import type { SHAPE_TYPES } from '../../interfaces/beams/common.types';

const geometryList = computed(() => Object.entries(store.geometry));
const geometryExtraData = computed(() => store.geometryExtra);

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
}

function onMouseEnter(event: MouseEvent) {
	setHoveredShapeID((event.target as HTMLElement).id);
}

function onMouseLeave(event: MouseEvent) {
	setHoveredShapeID(null);
}

</script>

<template>
	<aside class="left-panel">
		<ul class="shape-list">
			<li v-for="[uid, shape] in geometryList" :key="uid" :id="uid" class="shape-list__item"
				:class="{ 'shape-list__item--selected': uid === appSessionState.currentSelectedShapeID }"
				@click="onSelect(uid)" @mouseenter="onMouseEnter" @mouseleave="onMouseLeave">
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
	cursor: pointer;
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
