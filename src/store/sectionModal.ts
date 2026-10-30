import { reactive } from 'vue';
import { SHAPE_TYPES } from '../interfaces/beams/common.types';
import { appSessionState } from './store';

export type ShapeType = keyof typeof SHAPE_TYPES;

export const sectionModalState = reactive<{
	isOpen: boolean;
	shapeType: ShapeType | null;
	selectedShapeUID: string | null; // if we modify existing one
	showRotation: boolean; // draft of the preview checkbox, a new shape has no uid to store it under yet
}>({
	isOpen: false,
	shapeType: null,
	selectedShapeUID: null,
	showRotation: false,
});

export function openSectionModal(data: { shapeType: ShapeType, selectedShapeUID: string | null; }) {
	sectionModalState.shapeType = data.shapeType;
	sectionModalState.selectedShapeUID = data.selectedShapeUID;
	sectionModalState.showRotation = data.selectedShapeUID
		? appSessionState.showRotationFor[data.selectedShapeUID] ?? false
		: false;
	sectionModalState.isOpen = true;

}

export function closeSectionModal() {
	sectionModalState.isOpen = false;
	sectionModalState.selectedShapeUID = null;
}
