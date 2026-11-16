/** cursors the canvas interactions use; '' hands the cursor back to the browser default */
export const CURSOR = {
	DEFAULT: '',
	GRAB: 'grab',
	GRABBING: 'grabbing',
	CROSSHAIR: 'crosshair',
} as const;

/** screen pixels the mouse must travel after a press before it becomes a drag, so click jitter moves nothing */
export const DRAG_THRESHOLD = 3;

/** the gestures every canvas shares; a canvas puts its own gestures in front of these */
export const NAVIGATION_HINTS = ['Shift locks to horizontal / vertical', 'Right mouse pans', 'Wheel zooms'];

/** The drawn grid. */
export const GRID = {
	/** distance between two grid lines, in world units */
	CELL_SIZE: 10,
} as const;

/** MouseEvent.button values the canvases react to. */
export const MOUSE_BUTTON = {
	LEFT: 0,
	/** right mouse button */
	PAN: 2,
} as const;

/** Grabbing and clicking the points of the polygon in the custom shape form. */
export const POLYGON_EDITOR_INTERACTION = {
	/** how close (screen px) the cursor has to be to a point to grab it */
	HIT_RADIUS: 10,
	/** a press that moves less than this (screen px) is a click, not a drag */
	CLICK_TOLERANCE: 4,
} as const;

/** Snapping of dragged shapes and polygon points. */
export const SNAP = {
	/** the steps the user can pick, in mm */
	STEPS: [10, 5, 1, 0.5, 0.1, 0.05],
	DEFAULT_STEP: 1,
	/** decimals kept when snapping is off (one finer than the smallest step) and after snapping */
	FREE_DECIMALS: 2,
} as const;

export type SnapStep = typeof SNAP.STEPS[number];
