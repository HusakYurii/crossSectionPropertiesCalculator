/** cursors the canvas interactions use; '' hands the cursor back to the browser default */
export const CURSOR = {
	DEFAULT: '',
	GRAB: 'grab',
	GRABBING: 'grabbing',
	CROSSHAIR: 'crosshair',
} as const;

/** screen pixels the mouse must travel after a press before it becomes a drag, so click jitter moves nothing */
export const DRAG_THRESHOLD = 3;

/** The drawn grid. Its spacing follows the zoom, see getGridSpacing. */
export const GRID = {
	/** the finest spacing, in world units (mm) */
	MIN_STEP: 1,
	/** the narrowest a grid cell gets on screen, in CSS px: the spacing grows until the cells are this wide */
	MIN_CELL_PX: 10,
	/** the spacing climbs a 1-2-5 ladder: these mantissas times 1, 10, 100 ... */
	STEP_MANTISSAS: [1, 2, 5],
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

/** Object snaps (Endpoint) of the main canvas. */
export const OBJECT_SNAP = {
	/** how close (CSS px) the cursor has to be to a shape point to pick it */
	HIT_RADIUS: 10,
	/** points closer than this (px) to the nearest one count as a tie */
	TIE_TOLERANCE: 0.5,
	/** decimals kept on the snapped position: only float noise goes, the points still coincide */
	DECIMALS: 6,
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
