<script setup lang="ts">
import { ref, computed, watch, nextTick, onBeforeUnmount, type Component } from 'vue';
import { sectionModalState, closeSectionModal } from '@/store/ui/sectionModal';
import type { ShapeType } from '@/shared/shapes/types/common.types';
import { store } from '@/store/store';
import { history } from '@/store/history';
import { openInfoPanel } from '@/store/ui/infoPanel';
import { useModalKeyboard } from '@/shared/composables/useModalKeyboard';
import ISectionForm from './forms/ISectionForm.vue';
import CSectionForm from './forms/CSectionForm.vue';
import LSectionForm from './forms/LSectionForm.vue';
import ZSectionForm from './forms/ZSectionForm.vue';
import TSectionForm from './forms/TSectionForm.vue';
import { CustomShapeModalEditor } from '@/features/custom-shape-modal-editor';
import TubeSectionForm from './forms/TubeSectionForm.vue';
import RectSectionForm from './forms/RectSectionForm.vue';
import HollowRectSectionForm from './forms/HollowRectSectionForm.vue';
import PlaceholderSectionForm from './components/PlaceholderSectionForm.vue';
import SectionPropertiesTable from '@/shared/components/SectionPropertiesTable.vue';
import { FEM_SHAPE_TYPES, SHAPE_LABELS } from '@/shared/shapes/shapeLabels';
import { SHAPE_TYPES } from '@/shared/shapes/types/common.types';
import { EMPTY_CROSS_SECTION_PROPERTIES } from '@/shared/types/sectionProperties';
import { commitSectionForm } from './commitSectionForm';
import type { SectionFormExpose } from './sectionForm.types';

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
	CUSTOM_SHAPE: CustomShapeModalEditor,
};

const modalElRef = ref<HTMLElement | null>(null);
const formRef = ref<SectionFormExpose | null>(null);
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
const isCustomShape = computed(() => sectionModalState.shapeType === SHAPE_TYPES.CUSTOM_SHAPE);
const activeForm = computed(() => {
	const shapeType = sectionModalState.shapeType;
	return shapeType ? SHAPE_FORMS[shapeType] ?? null : null;
});

// Enter and the button do the same, so both ask this
const canConfirm = computed(() => !!activeForm.value && formRef.value?.isValid !== false);

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

function confirmAddShape() {
	if (!canConfirm.value) {
		return;
	}
	const form = formRef.value;
	if (!form || !form.geometry) {
		closeSectionModal();
		return;
	}

	const name = shapeName.value.trim() || randomShapeName();
	commitSectionForm({
		uid: sectionModalState.selectedShapeUID,
		name,
		result: form,
		showRotation: sectionModalState.showRotation,
	});
	closeSectionModal();
}

// undo, redo and paste wait while the dialog is open
const removeHistoryBlocker = history.addBlocker(() => sectionModalState.isOpen);
onBeforeUnmount(removeHistoryBlocker);

const onModalKeydown = useModalKeyboard({
	onCancel: closeSectionModal,
	onConfirm: confirmAddShape,
	canConfirm: () => canConfirm.value,
});

function openSolverInfo() {
	openInfoPanel(currentSolver.value === 'fem' ? 'whatIsFEMSolver' : 'whatIsGreensTheoremSolver');
}

</script>

<template>
	<Teleport defer to=".modals-container">
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

				<div class="modal-body" :class="{ 'modal-body--custom-shape': isCustomShape }">
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
							:disabled="!canConfirm" @click="confirmAddShape">
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
	width: min(90%, 1200px);
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

/* the custom shape is drawn on its canvas, so it gets more of the height than a preview does */
.modal-body--custom-shape .modal-section--properties {
	flex-basis: 28%;
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
