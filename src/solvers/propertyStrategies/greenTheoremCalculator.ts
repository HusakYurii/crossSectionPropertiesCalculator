import type { CrossSectionProperties } from "../../interfaces/sectionProperties";
import { radToDeg } from "../../mathUtils/anglesMath";
import type { Polygon } from "../../interfaces/common/types";

// Ixy and Ix - Iy this small, next to the size of Ix / Iy, are floating point noise and not a real asymmetry
const SYMMETRY_EPS = 1e-9;
// the closing point of a ring may differ from the first one by rounding in the last digits (a circle built from cos / sin)
const CLOSING_POINT_EPS = 1e-9;

/**
 * Angle of the principal axis of maximum inertia (U), counterclockwise from the X axis, in radians.
 *
 * A section that is symmetric about the X and Y axes has Ixy = 0, and then the principal axes ARE the X and Y axes. The
 * general formula atan2(-2 Ixy, Ix - Iy) cannot be trusted there: with Ixy of 1e-11 left over from rounding it picks
 * 0, 90 or -90 degrees depending on the sign of that noise (the sign of a zero even flips +90 into -90), and a square,
 * where Ix = Iy, turns into +/-45. So the axes are decided from the two inertias when Ixy is noise: X when Ix >= Iy,
 * Y otherwise, and X for a square.
 */
export function principalAxisAngleRad(Ix: number, Iy: number, Ixy: number): number {
	const scale = Math.max(Math.abs(Ix), Math.abs(Iy));
	if (Math.abs(Ixy) <= SYMMETRY_EPS * scale) {
		return Ix - Iy >= -SYMMETRY_EPS * scale ? 0 : Math.PI / 2;
	}
	return 0.5 * Math.atan2(-2 * Ixy, Ix - Iy);
}

/**
 * Section properties of a closed polygon from its vertices. The math is in docs/green_theorem_cross_section_properties_math.md.
 */
export function calculateCrossSectionProperties(polygon: Polygon, precision = 2): CrossSectionProperties {

	if (polygon.length < 3) {
		throw new Error("A valid polygon cross-section requires at least 3 vertices.");
	}

	polygon = [...polygon].reverse();
	// A ring is closed by repeating its first point, and that copy has to go: it would add a zero length edge, and for a ring
	// that is not closed, dropping the last point would silently cut a real corner off the shape.
	const first = polygon[0];
	const last = polygon[polygon.length - 1];
	if (Math.abs(first.x - last.x) <= CLOSING_POINT_EPS && Math.abs(first.y - last.y) <= CLOSING_POINT_EPS) {
		polygon.pop();
	}
	const n = polygon.length;

	let A = 0;
	let Qx0 = 0;
	let Qy0 = 0;
	let Ix0 = 0;
	let Iy0 = 0;
	let Ixy0 = 0;

	let x_min = Infinity;
	let x_max = -Infinity;
	let y_min = Infinity;
	let y_max = -Infinity;

	for (let i = 0; i < n; i++) {
		const { x: x_i, y: y_i } = polygon[i];
		const nextIdx = (i + 1) % n;
		const { x: x_next, y: y_next } = polygon[nextIdx];

		// Keep track of the outer perimeter boundaries
		if (x_i < x_min) x_min = x_i;
		if (x_i > x_max) x_max = x_i;
		if (y_i < y_min) y_min = y_i;
		if (y_i > y_max) y_max = y_i;

		const a_i = x_i * y_next - x_next * y_i;

		A += a_i;
		Qx0 += a_i * (y_i + y_next);
		Qy0 += a_i * (x_i + x_next);

		Ix0 += a_i * (y_i * y_i + y_i * y_next + y_next * y_next);
		Iy0 += a_i * (x_i * x_i + x_i * x_next + x_next * x_next);
		Ixy0 += a_i * (x_i * y_next + 2 * x_i * y_i + 2 * x_next * y_next + x_next * y_i);
	}

	A = A / 2;
	Qx0 = Qx0 / 6;
	Qy0 = Qy0 / 6;
	Ix0 = Ix0 / 12;
	Iy0 = Iy0 / 12;
	Ixy0 = Ixy0 / 24;

	if (A < 0) {
		A = Math.abs(A);
		Qx0 = -Qx0;
		Qy0 = -Qy0;
		Ix0 = -Ix0;
		Iy0 = -Iy0;
		Ixy0 = -Ixy0;
	}

	const centroid_x = Qy0 / A;
	const centroid_y = Qx0 / A;

	const Ix = Ix0 - A * centroid_y * centroid_y;
	const Iy = Iy0 - A * centroid_x * centroid_x;
	const Ixy = Ixy0 - A * centroid_x * centroid_y;

	const theta_p_rad = principalAxisAngleRad(Ix, Iy, Ixy);

	const traceOver2 = (Ix + Iy) / 2;
	const radius = Math.sqrt(Math.pow((Ix - Iy) / 2, 2) + Math.pow(Ixy, 2));
	const I_u = traceOver2 + radius;
	const I_v = traceOver2 - radius;

	const Ip = Ix + Iy;
	const rx = Math.sqrt(Ix / A);
	const ry = Math.sqrt(Iy / A);
	const r_u = Math.sqrt(I_u / A);
	const r_v = Math.sqrt(I_v / A);

	const c_top = y_max - centroid_y;
	const c_bot = centroid_y - y_min;
	const c_rt = x_max - centroid_x;
	const c_lf = centroid_x - x_min;

	const Wx_top = c_top > 0 ? Ix / c_top : 0;
	const Wx_bot = c_bot > 0 ? Ix / c_bot : 0;
	const Wy_rt = c_rt > 0 ? Iy / c_rt : 0;
	const Wy_lf = c_lf > 0 ? Iy / c_lf : 0;

	return {
		A: parseFloat(A.toFixed(precision)) + 0,
		centroid_x: parseFloat(centroid_x.toFixed(precision)) + 0,
		centroid_y: parseFloat(centroid_y.toFixed(precision)) + 0,
		Ix: parseFloat(Ix.toFixed(precision)) + 0,
		Iy: parseFloat(Iy.toFixed(precision)) + 0,
		Ixy: parseFloat(Ixy.toFixed(precision)) + 0,
		theta_p_deg: parseFloat(radToDeg(theta_p_rad).toFixed(precision)) + 0,
		I_u: parseFloat(I_u.toFixed(precision)) + 0,
		I_v: parseFloat(I_v.toFixed(precision)) + 0,
		Ip: parseFloat(Ip.toFixed(precision)) + 0,
		rx: parseFloat(rx.toFixed(precision)) + 0,
		ry: parseFloat(ry.toFixed(precision)) + 0,
		r_u: parseFloat(r_u.toFixed(precision)) + 0,
		r_v: parseFloat(r_v.toFixed(precision)) + 0,
		Wx_top: parseFloat(Wx_top.toFixed(precision)) + 0,
		Wx_bot: parseFloat(Wx_bot.toFixed(precision)) + 0,
		Wy_rt: parseFloat(Wy_rt.toFixed(precision)) + 0,
		Wy_lf: parseFloat(Wy_lf.toFixed(precision)) + 0,
	};
}