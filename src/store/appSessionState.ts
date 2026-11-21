import { reactive } from 'vue';
import { DEFAULT_QUICK_SOLVER_TOGGLES, type QuickSolverToggleKey, type QuickSolverToggles } from '../interfaces/quickSolverToggles';
import { DEFAULT_SNAP_OPTIONS_TOGGLES, type SnapOptionToggleKey, type SnapOptionsToggles } from '../interfaces/snapOptionsToggles';
import { SNAP, type SnapStep } from '../constants/canvasInteraction';

// not imported from store.ts: that file depends on this one, never the other way round
type UID = string;

/** x / y: how far the line is moved off its axis. xAlong / yAlong: where the number sits along the line, from its midpoint. */
export type DimensionLabelOffsetKey = 'x' | 'y' | 'xAlong' | 'yAlong';

type EditorSessionState = {
	currentSelectedShapeID: string | null;
	currentHoveredShapeID: string | null;
	redrawId: number;
	showRotationFor: Record<UID, boolean>; // only `true` entries are kept
	dimensionLabelOffsets: Record<UID, Partial<Record<DimensionLabelOffsetKey, number>>>;
	/** which of the section overlays (centroid, principal axes, gyration) are shown on the canvas; never saved or put in the history */
	quickSolverToggles: QuickSolverToggles;
	/** where the Cx / Cy labels of the section centroid were dragged to; like dimensionLabelOffsets, for the one label pair */
	compositeLabelOffsets: Partial<Record<DimensionLabelOffsetKey, number>>;
	/** snapping of dragged shapes and polygon points; shared by both canvases, never saved or put in the history, reset on a new or imported project */
	snapping: { enabled: boolean; step: SnapStep };
	/** hatching of the shapes in the editor; the report always hatches. Never saved or put in the history */
	showHatching: boolean;
	/** object snaps of the main canvas; never saved or put in the history */
	snapOptionsToggles: SnapOptionsToggles;
}

/** The part of the session state that is saved to the project file */
export type PersistedSessionState = Pick<EditorSessionState, 'showRotationFor' | 'dimensionLabelOffsets' | 'compositeLabelOffsets'>;

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
