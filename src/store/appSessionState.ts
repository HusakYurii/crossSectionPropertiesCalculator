import { reactive } from 'vue';
import { DEFAULT_QUICK_SOLVER_TOGGLES, DEFAULT_SNAP_OPTIONS_TOGGLES } from './viewToggles';
import type { QuickSolverToggleKey, SnapOptionToggleKey } from './viewToggles.types';
import type { EditorSessionState } from './appSessionState.types';
import type { DimensionLabelOffsetKey } from '@/shared/types/dimensionLabels';
import { SNAP } from '@/shared/math/snap';
import type { SnapStep } from '@/shared/math/snap';

// not imported from store.ts: that file depends on this one, never the other way round
type UID = string;

const DEFAULT_SNAPPING = { enabled: true, step: SNAP.DEFAULT_STEP } as const;

export const appSessionState = reactive<EditorSessionState>({
	currentSelectedShapeID: null,
	currentHoveredShapeID: null,
	redrawId: 0,
	showRotationFor: {},
	dimensionLabelOffsets: {},
	quickSolverToggles: { ...DEFAULT_QUICK_SOLVER_TOGGLES },
	compositeLabelOffsets: {},
	snapping: { ...DEFAULT_SNAPPING },
	showHatching: true,
	snapOptionsToggles: { ...DEFAULT_SNAP_OPTIONS_TOGGLES },
});

export type AppSessionState = typeof appSessionState;


// app state  ====================================

export const markStateDirty = () => {
	appSessionState.redrawId++;
}

export const setSelectedShapeID = (uid: string | null) => {
	appSessionState.currentSelectedShapeID = uid;
}

export const setHoveredShapeID = (uid: string | null) => {
	appSessionState.currentHoveredShapeID = uid;
}

export const setShowRotation = (uid: UID, value: boolean) => {
	if (value) {
		appSessionState.showRotationFor[uid] = true;
	} else {
		delete appSessionState.showRotationFor[uid];
	}
}

type LabelOffsets = Partial<Record<DimensionLabelOffsetKey, number>>;

// a stored along of 0 means "at the midpoint", not "auto", so only x / y are dropped at 0
const writeLabelOffset = (offsets: LabelOffsets, key: DimensionLabelOffsetKey, value: number) => {
	if (value === 0 && (key === 'x' || key === 'y')) {
		delete offsets[key];
		return;
	}
	offsets[key] = value;
}

const dropLabelAlong = (offsets: LabelOffsets, axis: 'x' | 'y') => {
	delete offsets[axis === 'x' ? 'xAlong' : 'yAlong'];
}

export const setDimensionLabelOffset = (uid: UID, axis: DimensionLabelOffsetKey, value: number) => {
	// dropping an offset of a shape that has none changes nothing
	if (value === 0 && (axis === 'x' || axis === 'y') && !appSessionState.dimensionLabelOffsets[uid]) {
		return;
	}
	const offsets = appSessionState.dimensionLabelOffsets[uid] ?? (appSessionState.dimensionLabelOffsets[uid] = {});
	writeLabelOffset(offsets, axis, value);
	// an empty record is not kept
	if (Object.keys(offsets).length === 0) {
		delete appSessionState.dimensionLabelOffsets[uid];
	}
}

/** Back to the automatic position along the line */
export const clearDimensionLabelAlong = (uid: UID, axis: 'x' | 'y') => {
	const offsets = appSessionState.dimensionLabelOffsets[uid];
	if (!offsets) {
		return;
	}
	dropLabelAlong(offsets, axis);
	if (Object.keys(offsets).length === 0) {
		delete appSessionState.dimensionLabelOffsets[uid];
	}
}

export const setCompositeLabelOffset = (key: DimensionLabelOffsetKey, value: number) => {
	writeLabelOffset(appSessionState.compositeLabelOffsets, key, value);
}

export const clearCompositeLabelAlong = (axis: 'x' | 'y') => {
	dropLabelAlong(appSessionState.compositeLabelOffsets, axis);
}

export const toggleQuickSolver = (key: QuickSolverToggleKey) => {
	appSessionState.quickSolverToggles[key] = !appSessionState.quickSolverToggles[key];
}

/** view toggles and grid snapping that are not part of the project: back to their defaults on a new / imported project */
export const resetViewToggles = () => {
	Object.assign(appSessionState.quickSolverToggles, DEFAULT_QUICK_SOLVER_TOGGLES);
	Object.assign(appSessionState.snapOptionsToggles, DEFAULT_SNAP_OPTIONS_TOGGLES);
	Object.assign(appSessionState.snapping, DEFAULT_SNAPPING);
	appSessionState.showHatching = true;
}

export const toggleSnapOption = (key: SnapOptionToggleKey) => {
	appSessionState.snapOptionsToggles[key] = !appSessionState.snapOptionsToggles[key];
}

export const removeShapeSessionState = (uid: UID) => {
	delete appSessionState.showRotationFor[uid];
	delete appSessionState.dimensionLabelOffsets[uid];
}

export const setSnappingEnabled = (on: boolean) => {
	appSessionState.snapping.enabled = on;
}

export const setSnappingStep = (step: SnapStep) => {
	appSessionState.snapping.step = step;
}

export const setShowHatching = (on: boolean) => {
	appSessionState.showHatching = on;
	markStateDirty();
}
