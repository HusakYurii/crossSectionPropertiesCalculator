import { CANVAS_FONT } from '@/shared/canvas/canvasStyle';

/** The canvas of the custom shape form. */
export const CUSTOM_SHAPE_EDITOR_VIEW = {
	MIN_ZOOM: 0.5,
	MAX_ZOOM: 20,
	/** the zoom a new, empty shape starts with: the grid is 5 mm there, so its cells are easy to hit */
	START_ZOOM: 3,
	/** share of the canvas an existing shape fills when it is fitted */
	FIT_MARGIN: 0.8,
} as const;

/** Grabbing and clicking the points of the polygon in the custom shape form. */
export const POLYGON_EDITOR_INTERACTION = {
	/** how close (screen px) the cursor has to be to a point to grab it */
	HIT_RADIUS: 10,
	/** a press that moves less than this (screen px) is a click, not a drag */
	CLICK_TOLERANCE: 4,
} as const;

/** The polygon being drawn in the custom shape form. Sizes are in screen px. */
export const POLYGON_EDITOR_STYLE = {
	LINE_WIDTH: 2,
	POINT_RADIUS: 6,
	SELECTED_RING: 4,
	/** the offset was tuned for a 16 px number, so it grows with the font */
	LABEL_OFFSET: 12 * CANVAS_FONT.LABEL_SIZE / 16,
	FILL: 'rgba(109, 182, 49, 0.18)',
	STROKE: 'rgba(40, 90, 20, 1)',
	POINT: 'rgba(40, 90, 20, 1)',
	SELECTED: 'rgba(220, 60, 60, 1)',
	SELECTED_FILL: 'rgba(220, 60, 60, 0.25)',
	LABEL: 'rgba(0, 0, 0, 0.7)',
	SELECTION_BOX_STROKE: 'rgba(40, 110, 220, 0.9)',
	SELECTION_BOX_FILL: 'rgba(40, 110, 220, 0.12)',
	/** dash and gap in px */
	SELECTION_BOX_DASH: [6, 4],
} as const;
