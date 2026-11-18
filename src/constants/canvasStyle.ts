/** The text on every canvas. */
export const CANVAS_FONT = {
	/**
	 * The one typeface of the app. style.css sets the page font from the CSS variable --font-family; a canvas cannot
	 * use a CSS variable in `context.font`, so it reads the same family from here. Keep the two in step.
	 */
	FAMILY: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
	/**
	 * The one size of the labels written on the editing canvases (in screen px), so dimensions, axes and angles read alike.
	 * The dimension and leader annotations use it on every canvas, the shape preview and the report too, so changing it changes those as well.
	 */
	LABEL_SIZE: 22,
} as const;

/** The x / y axes and the principal u / v axes drawn through the origin or the centroid. */
export const AXIS_STYLE = {
	/** CAD convention: X axis is red, Y axis is green. */
	COLORS: {
		x: 'rgba(220, 60, 60, 1)',
		y: 'rgba(40, 170, 80, 1)',
	},
	/** Principal axes: U is the max-inertia axis (like x), V the min-inertia axis (like y). */
	PRINCIPAL_COLORS: {
		u: 'rgba(30, 110, 220, 1)',
		v: 'rgba(235, 140, 20, 1)',
	},
	/**
	 * Free space kept under the top edge of the canvas for the labels of the axes, in CSS px: the options
	 * bar floats there (8 margin + 32 control + 8 gap).
	 */
	LABEL_TOP_RESERVE: 48,
	/** line width of the axes in screen px */
	LINE_WIDTH: 1.5,
	/** line width of the main x / y axes through the origin, in screen px */
	MAIN_LINE_WIDTH: 2,
	/** dash pattern in screen px, [dash, gap] */
	DASH: [8, 6],
	/** dash-dot pattern of the principal u / v axes, so they read as a different kind of axis than x / y */
	PRINCIPAL_DASH: [10, 4, 2, 4],
	/** default font size of the labels in screen px */
	LABEL_FONT_SIZE: 18,
	/** how far the label sits in from the far end of its axis, in screen px */
	LABEL_INSET: 40,
	/** how far the label is nudged off its line, in screen px */
	LABEL_GAP: 12,
} as const;

/** The cross on the shape centroid in the property previews. */
export const CENTROID_STYLE = {
	COLOR: 'rgba(0, 0, 0, 0.6)',
	/** default size of the cross in screen px */
	CROSS_SIZE: 6,
	/** in screen px */
	LINE_WIDTH: 2.7,
} as const;

/** The cross GenericBeamView draws at the origin of a shape. Looks like the centroid cross, but it is its own feature. */
export const ORIGIN_CROSS_STYLE = {
	COLOR: 'rgba(0, 0, 0, 0.6)',
	/** in screen px */
	SIZE: 6,
	/** in screen px */
	LINE_WIDTH: 2,
} as const;

/** Ellipse of gyration drawn in the shape preview. */
export const GYRATION_STYLE = {
	COLOR: 'rgba(37, 99, 235, 1)',
	LINE_WIDTH: 1.5,
	/** dash pattern in screen px, [dash, gap] */
	DASH: [7, 5],
} as const;

/** The arc and the text that show the rotation of the principal axes. */
export const PRINCIPAL_ANGLE_STYLE = {
	LINE_WIDTH: 1.5,
	ARC_RADIUS: 56,
	/** between the arc and the text when it sits along the bisector, in screen px */
	LABEL_GAP: 8,
	/** between the X axis and the text when it sits beside it, in screen px */
	LABEL_PAD: 6,
} as const;

/**
 * Dimension lines with a label centered on them (DimensionsWithLabel), also used for the part drawings of the report.
 * Sizes are in screen px.
 */
export const DIMENSION_STYLE = {
	LINE_WIDTH: 1.89,
	ARROW_HEAD_SIZE: 9.45,
	EXTENSION_OVERSHOOT: 8,
	LABEL_PADDING: 6,
	MIN_ARROW_SPAN: 40,
	/** the canvas background (--color-surface-canvas), so the box that sits on the line leaves no visible edge */
	LABEL_BACKGROUND: '#fafbfc',
	/** dash and gap length of the connector line, the default of every BaseDimensions */
	DASH_SIZE: 6,
} as const;

/** The distance arrows of the editor (DimensionsWithTextLabel) with a draggable number. Sizes are in screen px. */
export const EDITABLE_DIMENSION_STYLE = {
	LINE_WIDTH: 2,
	ARROW_HEAD_SIZE: 13.5,
	DASH_SIZE: 16,
	LABEL_PADDING: 6,
	/** a dimension shorter than this (world mm) gets its arrow heads outside the ends, so they don't cover the number */
	SMALL_DIMENSION: 20,
	/** length of the tails the outside arrow heads sit on, in arrow heads */
	TAIL_FACTOR: 1.5,
} as const;

/** Leader lines (LeaderWithArrow, LeaderWithDot). Sizes are in screen px. */
export const LEADER_STYLE = {
	LINE_WIDTH: 1.89,
	DIAGONAL: 30,
	SHELF: 50,
	LABEL_GAP: 4,
	ARROW_HEAD_SIZE: 9.45,
	DOT_RADIUS: 5,
} as const;

/** The beams on the main canvas. */
export const BEAM_STYLE = {
	/** outline width in screen px */
	LINE_WIDTH: 2,
	/** outline of the debug bounding box */
	DEBUG_STROKE: 'rgba(59, 0, 253, 1)',
	FILL: {
		HOVER: 'rgb(196 236 254)',
		SELECTED: 'rgb(72 183 255)',
		NONE: '#ffffff',
	},
	NEGATIVE_FILL: {
		HOVER: '#fcbba1',
		SELECTED: '#fc9272',
		NONE: '#ffffff',
	},
	/** the ISO 128 hatching of the cut material (positive shapes) */
	HATCH: {
		COLOR: '#000',
		/** fewest lines across a shape */
		MIN_LINES: 10,
		/** lines = DENSITY * sqrt(size in mm), size = sqrt(area): 100 mm -> 17 lines, 400 mm -> 34 */
		DENSITY: 1.7,
		/** the densest the hatch gets when a shape is tiny on screen, in CSS px */
		MIN_SPACING: 1.5,
		/** in screen px: thin against the 2 px outline (ISO thin:wide 1:2) */
		LINE_WIDTH: 1,
	},
} as const;

/** The FEM mesh lines. */
export const MESH_STYLE = {
	STROKE: 'rgba(0, 110, 255, 1)',
	/** in world units, for the editor canvas */
	LINE_WIDTH: 0.13,
	/** in device pixels, like every size getScaledSize() returns: half a CSS pixel at RENDER_SCALE 2 */
	REPORT_LINE_WIDTH: 1,
} as const;

/** The background grid. */
export const GRID_STYLE = {
	/** which lines are major (thicker/darker) follows from the spacing, see getGridSpacing */
	MINOR_LINE_WIDTH: 1.5,
	MAJOR_LINE_WIDTH: 2.5,
	MINOR_COLOR: '#e2e2e2',
	MAJOR_COLOR: '#c8c8c8',
} as const;

/** The scale bar in the bottom-right corner of every canvas. Sizes are in CSS px. */
export const SCALE_BAR_STYLE = {
	/** distance from the right and bottom edges of the canvas, in canvas px */
	MARGIN: 24,
	/** full height of the end ticks */
	TICK_HEIGHT: 12,
	LINE_WIDTH: 2,
	/** text gray, a shade darker than the grid lines */
	COLOR: '#555',
	FONT_SIZE: 18,
	/** gap between the bar and the label above it */
	LABEL_GAP: 6,
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
