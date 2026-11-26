import type { DimensionLabelOffsetKey } from '@/shared/types/dimensionLabels';
import type { SnapStep } from '@/shared/math/snap';
import type { QuickSolverToggles, SnapOptionsToggles } from './viewToggles.types';

type UID = string;

export type EditorSessionState = {
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
