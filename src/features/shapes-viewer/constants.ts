/** "Fit to screen" on the main canvas. */
export const MAIN_VIEW_FIT = {
	/**
	 * screen pixels left between the shapes and the canvas edges by "Fit to screen"; it also leaves
	 * room for the dimension numbers, which are not part of the fitted bounds
	 */
	MARGIN: 72,
} as const;

/** screen pixels the mouse must travel after a press before it becomes a drag, so click jitter moves nothing */
export const DRAG_THRESHOLD = 3;

/** Object snaps (Endpoint) of the main canvas. */
export const OBJECT_SNAP = {
	/** how close (CSS px) the cursor has to be to a shape point to pick it */
	HIT_RADIUS: 10,
	/** points closer than this (px) to the nearest one count as a tie */
	TIE_TOLERANCE: 0.5,
	/** decimals kept on the snapped position: only float noise goes, the points still coincide */
	DECIMALS: 6,
} as const;

/** The point markers of the object snaps on the main canvas. Sizes are in screen px. */
export const OBJECT_SNAP_STYLE = {
	POINT_RADIUS: 4,
	HOVER_RING: 4,
	SELECTED_RING: 4,
	POINT: 'rgba(44, 51, 64, 0.85)',
	HOVER_FILL: 'rgba(44, 51, 64, 0.2)',
	SELECTED: 'rgba(220, 60, 60, 1)',
	SELECTED_FILL: 'rgba(220, 60, 60, 0.25)',
} as const;
