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
