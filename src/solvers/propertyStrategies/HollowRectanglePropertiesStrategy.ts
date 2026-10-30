import { SHAPE_TYPES } from "../../interfaces/beams/common.types";
import type { Geometry } from "../../interfaces/beams/common.types";
import type { HollowRectangleGeometry, RoundedHollowRectangleGeometry } from "../../interfaces/beams/RectSection.types";
import type { Point } from "../../interfaces/common/types";
import type { CrossSectionProperties } from "../../interfaces/sectionProperties";
import { radToDeg } from "../../mathUtils/anglesMath";
import { calculateCrossSectionProperties } from "./greenTheoremCalculator";
import { getHollowRectangleRingLengths } from "../polygonStrategies/HollowRectangleStrategy";
import { principalAxisAngleRad } from "./greenTheoremCalculator";
import { AbstractPropertiesStrategy } from "./AbstractPropertiesStrategy";

const PRECISION = 2;
// the two rings are solved at a higher precision so the subtraction below doesn't lose digits
const RING_PRECISION = 8;

/**
 * Hollow rectangle: properties of the outer ring minus properties of the inner ring.
 * HollowRectangleStrategy builds the polygon as the outer ring followed by the inner ring;
 * the ring lengths come from getHollowRectangleRingLengths.
 */
export class HollowRectanglePropertiesStrategy extends AbstractPropertiesStrategy<HollowRectangleGeometry | RoundedHollowRectangleGeometry> {
	test(geometry: Geometry) {
		return geometry.type === SHAPE_TYPES.HOLLOW_RECTANGLE || geometry.type === SHAPE_TYPES.HOLLOW_ROUNDED_RECTANGLE;
	}

	execute(geometry: HollowRectangleGeometry | RoundedHollowRectangleGeometry, polygon: Point[]): CrossSectionProperties {
		const { w1, h1, w2, h2 } = geometry;

		if (w1 <= 0 || h1 <= 0) {
			throw new Error("Outer width and height must be greater than 0.");
		}
		if (w2 <= 0 || h2 <= 0) {
			throw new Error("Inner width and height must be greater than 0.");
		}
		if (w2 >= w1 || h2 >= h1) {
			throw new Error("Inner rectangle must be strictly smaller than the outer one.");
		}

		const { outer: outerLength } = getHollowRectangleRingLengths(geometry);
		const outerRing = polygon.slice(0, outerLength);
		const innerRing = polygon.slice(outerLength);

		const outer = calculateCrossSectionProperties(outerRing, RING_PRECISION);
		const inner = calculateCrossSectionProperties(innerRing, RING_PRECISION);

		const A = outer.A - inner.A;
		const centroid_x = (outer.A * outer.centroid_x - inner.A * inner.centroid_x) / A;
		const centroid_y = (outer.A * outer.centroid_y - inner.A * inner.centroid_y) / A;

		// each ring's centroidal inertia moved to the combined centroid (parallel axis theorem), then subtracted
		const shift = (ring: CrossSectionProperties) => ({
			dx: ring.centroid_x - centroid_x,
			dy: ring.centroid_y - centroid_y,
		});
		const so = shift(outer);
		const si = shift(inner);

		const Ix = (outer.Ix + outer.A * so.dy * so.dy) - (inner.Ix + inner.A * si.dy * si.dy);
		const Iy = (outer.Iy + outer.A * so.dx * so.dx) - (inner.Iy + inner.A * si.dx * si.dx);
		const Ixy = (outer.Ixy + outer.A * so.dx * so.dy) - (inner.Ixy + inner.A * si.dx * si.dy);

		const theta_p_rad = principalAxisAngleRad(Ix, Iy, Ixy);
		const traceOver2 = (Ix + Iy) / 2;
		const radius = Math.sqrt(Math.pow((Ix - Iy) / 2, 2) + Math.pow(Ixy, 2));
		const I_u = traceOver2 + radius;
		const I_v = traceOver2 - radius;

		// the outer ring bounds the section, so it gives the extreme fibers
		let x_min = Infinity, x_max = -Infinity, y_min = Infinity, y_max = -Infinity;
		for (const { x, y } of outerRing) {
			x_min = Math.min(x_min, x);
			x_max = Math.max(x_max, x);
			y_min = Math.min(y_min, y);
			y_max = Math.max(y_max, y);
		}
		const c_top = y_max - centroid_y;
		const c_bot = centroid_y - y_min;
		const c_rt = x_max - centroid_x;
		const c_lf = centroid_x - x_min;

		return {
			A: this._round(A),
			centroid_x: this._round(centroid_x),
			centroid_y: this._round(centroid_y),
			Ix: this._round(Ix),
			Iy: this._round(Iy),
			Ixy: this._round(Ixy),
			theta_p_deg: this._round(radToDeg(theta_p_rad)),
			I_u: this._round(I_u),
			I_v: this._round(I_v),
			Ip: this._round(Ix + Iy),
			rx: this._round(Math.sqrt(Ix / A)),
			ry: this._round(Math.sqrt(Iy / A)),
			r_u: this._round(Math.sqrt(I_u / A)),
			r_v: this._round(Math.sqrt(I_v / A)),
			Wx_top: this._round(c_top > 0 ? Ix / c_top : 0),
			Wx_bot: this._round(c_bot > 0 ? Ix / c_bot : 0),
			Wy_rt: this._round(c_rt > 0 ? Iy / c_rt : 0),
			Wy_lf: this._round(c_lf > 0 ? Iy / c_lf : 0),
		};
	}

	private _round(value: number): number {
		return parseFloat(value.toFixed(PRECISION));
	}
}
