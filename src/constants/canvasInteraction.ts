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
export const NAVIGATION_HINTS = ['Shift snaps to the grid', 'Right mouse pans', 'Wheel zooms'];

/** The grid dragging snaps to. */
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
