<script setup lang="ts">
import { ref, computed, watch, nextTick, type Component } from 'vue';
import { sectionModalState, closeSectionModal } from '../../store/sectionModal.ts';
import type { ShapeType } from '../../store/sectionModal.ts';
import { addGeometryData, updateGeometryData, getUID, store, addCrossSectionProperties, updateCrossSectionProperties, updateCrossSectionPolygon, addCrossSectionPolygon, updateGeometryExtraData, addGeometryExtraData, setCrossSectionMesh, removeCrossSectionMesh, setShowRotation } from '../../store/store.ts';
import { history } from '../../store/history.ts';
import type { Geometry } from '../../interfaces/beams/common.types.ts';
import ISectionForm from './forms/ISectionForm.vue';
import CSectionForm from './forms/CSectionForm.vue';
import LSectionForm from './forms/LSectionForm.vue';
import ZSectionForm from './forms/ZSectionForm.vue';
import TSectionForm from './forms/TSectionForm.vue';
import CustomShapeForm from './forms/CustomShapeForm.vue';
import TubeSectionForm from './forms/TubeSectionForm.vue';
import RectSectionForm from './forms/RectSectionForm.vue';
import HollowRectSectionForm from './forms/HollowRectSectionForm.vue';
import PlaceholderSectionForm from './forms/PlaceholderSectionForm.vue';
import SectionPropertiesTable from './forms/SectionPropertiesTable.vue';
import { FEM_SHAPE_TYPES, SHAPE_LABELS } from '../../interfaces/beams/shapeLabels.ts';
import { EMPTY_CROSS_SECTION_PROPERTIES, type CrossSectionProperties } from '../../interfaces/sectionProperties';
import type { Point } from '../../interfaces/common/types.ts';
import type { Triangle } from '../../solvers/femTriangulator/triangulate.ts';

type SolverType = 'simple' | 'fem';

const SHAPE_FORMS: Partial<Record<ShapeType, Component>> = {
	RECTANGLE: RectSectionForm,
	ROUNDED_RECTANGLE: RectSectionForm,
	HOLLOW_RECTANGLE: HollowRectSectionForm,
	HOLLOW_ROUNDED_RECTANGLE: HollowRectSectionForm,
	TUBE: TubeSectionForm,
	HOLLOW_TUBE: TubeSectionForm,
	I_SECTION: ISectionForm,
	C_SECTION: CSectionForm,
	T_SECTION: TSectionForm,
	L_SECTION: LSectionForm,
	Z_SECTION: ZSectionForm,
	CUSTOM_SHAPE: CustomShapeForm,
};

const modalElRef = ref<HTMLElement | null>(null);
/**
 * What a form exposes to the modal. isValid is optional: a form that can be in a state it cannot be
 * saved from (a custom shape with too few points, or results that are out of date) exposes it.
 */
type SectionFormExposed = {
	geometry: Geometry;
	crossSectionProperties: CrossSectionProperties;
	crossSectionPolygon: Point[];
	/** only forms that mesh the shape (FEM) expose one; it is saved next to the polygon */
	crossSectionMesh?: Triangle[];
	isValid?: boolean;
};

const formRef = ref<SectionFormExposed | null>(null);
const shapeName = ref('');

function randomShapeName() {
	return `Shape_${Math.floor(Math.random() * 100000)}`;
}

const currentSolver = computed<SolverType>(() => {
	const shapeType = sectionModalState.shapeType;
	return shapeType && FEM_SHAPE_TYPES.has(shapeType) ? 'fem' : 'simple';
});

const crossSectionProperties = computed(() => formRef.value?.crossSectionProperties ?? EMPTY_CROSS_SECTION_PROPERTIES);

const isFemModeSelected = computed(() => currentSolver.value === 'fem');
const isSimpleModeSelected = computed(() => currentSolver.value === 'simple');
const activeForm = computed(() => {
	const shapeType = sectionModalState.shapeType;
	return shapeType ? SHAPE_FORMS[shapeType] ?? null : null;
});

const isExistingShape = computed(() => {
	if (sectionModalState.selectedShapeUID === null) {
		return false
	}
	return Boolean(store.geometry[sectionModalState.selectedShapeUID])
})

watch(() => sectionModalState.isOpen, (isOpen) => {
	if (isOpen) {
		nextTick(() => modalElRef.value?.focus());

		const uid = sectionModalState.selectedShapeUID;
		const existing = uid ? store.geometryExtra[uid] : null;
		if (existing) {
			shapeName.value = existing.name;
		} else {
			shapeName.value = randomShapeName();
		}
	}
});

/** an empty or missing mesh means there is nothing to keep, so an old one must not stay behind */
function saveMesh(uid: string, mesh: Triangle[] | undefined) {
	if (mesh && mesh.length > 0) {
		setCrossSectionMesh({ uid, data: mesh });
	} else {
		removeCrossSectionMesh(uid);
	}
}

function confirmAddShape() {
	const form = formRef.value;
	const geometry = form?.geometry;
	if (!form || !geometry) {
		closeSectionModal();
		return;
	}

	const uid = sectionModalState.selectedShapeUID ?? getUID();
	const name = shapeName.value.trim() || randomShapeName();

	if (sectionModalState.selectedShapeUID) {
		updateGeometryExtraData({ uid, data: { name } })
		updateGeometryData({ uid, data: geometry });
		updateCrossSectionPolygon({ uid, data: form.crossSectionPolygon });
		updateCrossSectionProperties({ uid, data: form.crossSectionProperties });
		saveMesh(uid, form.crossSectionMesh);
	} else {
		addGeometryExtraData({ uid, data: { name, position: { x: 0, y: 0 } } })
		addGeometryData({ uid, data: geometry });
		addCrossSectionPolygon({ uid, data: form.crossSectionPolygon });
		addCrossSectionProperties({ uid, data: form.crossSectionProperties });
		saveMesh(uid, form.crossSectionMesh);
	}

	setShowRotation(uid, sectionModalState.showRotation);
	history.commit();
	closeSectionModal();
}

function onModalKeydown(event: KeyboardEvent) {
	event.stopPropagation();
	if (event.key === 'Escape') {
		closeSectionModal();
	}
}

function openSolverInfo() {
	// TODO: open a modal or slide-in panel with solver info
}

</script>

<template>
	<Teleport to="body">
		<div v-if="sectionModalState.isOpen" ref="modalElRef" class="modal-overlay" tabindex="-1"
			@keydown="onModalKeydown">
			<div class="modal" role="dialog" aria-modal="true">
				<div class="modal-header">
					<div class="solver-modes">
						<span class="solver-modes-title">Current Solver:</span>
						<div class="solver-modes-simple-btn" v-if="isSimpleModeSelected">
							<span>Green’s Theorem</span>
						</div>
						<div class="solver-modes-fem-btn" v-if="isFemModeSelected">
							<span>FEM</span>
						</div>
						<button type="button" class="solver-modes-info-btn" aria-label="Solver info"
							@click="openSolverInfo">?</button>
					</div>
					<button type="button" class="modal-close" aria-label="Close" @click="closeSectionModal">✕</button>
				</div>

				<div class="modal-body">
					<section class="modal-section modal-section--form">
						<input v-if="activeForm" v-model="shapeName" type="text" class="shape-name-input"
							aria-label="Shape name" placeholder="Shape name" />
						<component ref="formRef" v-if="activeForm" :is="activeForm"
							:selectedShapeUID="sectionModalState.selectedShapeUID" />
						<PlaceholderSectionForm v-else :label="SHAPE_LABELS[sectionModalState.shapeType!]" />
					</section>

					<section class="modal-section modal-section--properties">
						<SectionPropertiesTable class="modal-properties" :properties="crossSectionProperties" />
					</section>

					<section class="modal-section modal-section--actions">
						<button v-if="activeForm" type="button" class="modal-btn modal-btn-add"
							:disabled="formRef?.isValid === false" @click="confirmAddShape">
							{{ isExistingShape ? 'Save' : 'Create' }}
						</button>

					</section>
				</div>
			</div>
		</div>
	</Teleport>
</template>

<style scoped>
.modal-overlay {
	position: fixed;
	inset: 0;
	z-index: 100;
	display: flex;
	align-items: center;
	justify-content: center;
	background: var(--color-overlay);
	outline: none;
}

.modal {
	position: relative;
	width: min(90%, 1000px);
	height: 90%;
	padding: 16px;
	display: flex;
	flex-direction: column;
	background: var(--color-surface-chrome);
	border: 1px solid var(--color-border-subtle);
	border-radius: 10px;
	box-shadow: 0 12px 32px var(--color-shadow-strong);
}

.modal-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
}

.solver-modes {
	display: flex;
	align-items: center;
	gap: 10px;
	user-select: none;
}

.solver-modes-title {
	font-size: 11px;
	font-weight: 700;
	letter-spacing: 0.04em;
	text-transform: uppercase;
	color: var(--color-text);
	opacity: 0.7;
}

.solver-modes-simple-btn,
.solver-modes-fem-btn {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 4px 16px;
	border-radius: 5px;
	background: var(--color-fill-faint);
	font-size: 12px;
	font-weight: 600;
}

.solver-modes-simple-btn span,
.solver-modes-fem-btn span {
	color: var(--color-text);
}

.solver-modes-simple-btn input,
.solver-modes-fem-btn input {
	cursor: pointer;
}

.solver-modes-info-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 18px;
	height: 18px;
	padding: 0;
	border: none;
	border-radius: 50%;
	background: var(--color-fill);
	color: var(--color-text);
	font-size: 11px;
	font-weight: 700;
	line-height: 1;
	cursor: pointer;
}

.solver-modes-info-btn:hover {
	background: var(--color-fill-hover);
}

.modal-close {
	flex-shrink: 0;
	width: 24px;
	height: 24px;
	border: none;
	border-radius: 50%;
	background: var(--color-fill);
	color: var(--color-text);
	font-size: 12px;
	line-height: 1;
	cursor: pointer;
}

.modal-close:hover {
	background: var(--color-fill-hover);
}

.modal-body {
	flex: 1;
	min-height: 0;
	margin-top: 10px;
	display: flex;
	flex-direction: column;
	gap: 16px;
	color: var(--color-text);
}

.modal-section {
	flex-shrink: 0;
}

.modal-section--form {
	position: relative;
	/* takes all the height the properties table no longer needs, so the preview grows */
	flex: 1 1 0;
	min-height: 224px;
}

.modal-section--form :deep(.shape-layout) {
	height: 100%;
}

.shape-name-input {
	position: absolute;
	top: 8px;
	left: 8px;
	z-index: 1;
	width: 140px;
	height: 26px;
	padding: 0 8px;
	border: 1px solid var(--color-border-subtle);
	border-radius: 6px;
	background: var(--color-surface-chrome);
	font-size: 12px;
	font-weight: 600;
	color: var(--color-text);
	outline: none;
}

.modal-section--properties {
	flex: 0 0 36%;
	min-height: 0;
	overflow-y: auto;
}

.modal-section--actions {
	display: flex;
	justify-content: center;

}

.modal-properties {
	flex-shrink: 0;
}

.modal-btn {
	height: 32px;
	padding: 0 14px;
	margin: 0 5px;
	border: none;
	border-radius: 6px;
	background: var(--color-text);
	color: var(--color-surface-chrome);
	font-size: 13px;
	cursor: pointer;
}

.modal-btn:hover {
	opacity: 0.9;
}

.modal-btn:disabled {
	opacity: 0.4;
	cursor: not-allowed;
}
</style>
