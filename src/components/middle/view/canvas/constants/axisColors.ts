/** CAD convention: X axis is red, Y axis is green. */
export const AXIS_COLORS: Record<'x' | 'y', string> = {
	x: 'rgba(220, 60, 60, 1)',
	y: 'rgba(40, 170, 80, 1)',
};

/** Principal axes: U is the max-inertia axis (like x), V the min-inertia axis (like y). */
export const PRINCIPAL_AXIS_COLORS: Record<'u' | 'v', string> = {
	u: 'rgba(30, 110, 220, 1)',
	v: 'rgba(235, 140, 20, 1)',
};

/** Ellipse of gyration drawn in the shape preview. */
export const GYRATION_ELLIPSE_COLOR = 'rgba(37, 99, 235, 1)';
