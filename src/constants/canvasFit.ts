/** The shape preview of the section form and of the report. */
export const SHAPE_PREVIEW_FIT = {
	/** uid the previewed shape gets in its own store */
	UID: 'preview',
	MARGIN: 0.8,
} as const;

/** The canvas of the custom shape form. */
export const CUSTOM_SHAPE_EDITOR_VIEW = {
	MIN_ZOOM: 0.5,
	MAX_ZOOM: 20,
	/** the zoom a new, empty shape starts with, so the 10 unit grid is easy to hit */
	START_ZOOM: 3,
	/** share of the canvas an existing shape fills when it is fitted */
	FIT_MARGIN: 0.8,
} as const;

/** "Fit to screen" on the main canvas. */
export const MAIN_VIEW_FIT = {
	/**
	 * screen pixels left between the shapes and the canvas edges by "Fit to screen"; it also leaves
	 * room for the dimension numbers, which are not part of the fitted bounds
	 */
	MARGIN: 72,
} as const;

/** The picture of the whole section in the report. */
export const REPORT_SECTION_CANVAS = {
	WIDTH: 680,
	HEIGHT: 420,
	FIT_MARGIN: 0.75,
} as const;

/**
 * device pixels per CSS pixel of the pictures rendered for the report. getScaledSize() divides by the transform scale,
 * which includes the dpr, so line widths and label fonts are in device pixels: at 2 they come out as in the editor
 * on a retina screen. A higher scale would make labels smaller.
 */
export const RENDER_SCALE = 2;
