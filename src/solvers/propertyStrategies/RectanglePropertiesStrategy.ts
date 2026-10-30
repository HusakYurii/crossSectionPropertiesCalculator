import { SHAPE_TYPES } from "../../interfaces/beams/common.types";
import type { Geometry } from "../../interfaces/beams/common.types";
import type { RectangleGeometry } from "../../interfaces/beams/RectSection.types";
import type { Point } from "../../interfaces/common/types";
import type { CrossSectionProperties } from "../../interfaces/sectionProperties";
import { calculateCrossSectionProperties } from "./greenTheoremCalculator";
import { AbstractPropertiesStrategy } from "./AbstractPropertiesStrategy";

export class RectanglePropertiesStrategy extends AbstractPropertiesStrategy<RectangleGeometry> {
	test(geometry: Geometry) {
		return geometry.type === SHAPE_TYPES.RECTANGLE;
	}

	execute(geometry: RectangleGeometry, polygon: Point[]): CrossSectionProperties {
		// The closed form below is for a rectangle with its sides on the X and Y axes. A turned one (rotation is in
		// degrees) has other inertias and a tilted principal axis, so it is solved from its polygon. A half turn
		// gives the same rectangle, so that one keeps the closed form.
		if (Math.abs(geometry.rotation % 180) > 1e-9) {
			return calculateCrossSectionProperties(polygon);
		}

		const { w, h } = geometry;

		const A = w * h;
		const Ix = (w * h * h * h) / 12;
		const Iy = (h * w * w * w) / 12;
		const Ip = Ix + Iy;

		const rx = h / Math.sqrt(12);
		const ry = w / Math.sqrt(12);

		// U is the axis of maximum inertia: X for a tall (or square) rectangle, Y for a wide one. The overlays
		// lay the ellipse of gyration out along U, so a fixed 0 turns it the wrong way for a wide rectangle.
		const theta_p_deg = Ix >= Iy ? 0 : 90;

		const I_u = Math.max(Ix, Iy);
		const I_v = Math.min(Ix, Iy);
		const r_u = Math.max(rx, ry);
		const r_v = Math.min(rx, ry);

		const Wx = Ix / (h / 2);
		const Wy = Iy / (w / 2);

		return {
			A: A,
			centroid_x: 0,
			centroid_y: 0,
			Ix: Ix,
			Iy: Iy,
			Ixy: 0,
			theta_p_deg: theta_p_deg,
			I_u: I_u,
			I_v: I_v,
			Ip: Ip,
			rx: rx,
			ry: ry,
			r_u: r_u,
			r_v: r_v,
			Wx_top: Wx,
			Wx_bot: Wx,
			Wy_rt: Wy,
			Wy_lf: Wy
		};
	}
}
