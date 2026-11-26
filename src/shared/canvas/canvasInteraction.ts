/** cursors the canvas interactions use; '' hands the cursor back to the browser default */
export const CURSOR = {
	DEFAULT: '',
	GRAB: 'grab',
	GRABBING: 'grabbing',
	CROSSHAIR: 'crosshair',
} as const;

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
