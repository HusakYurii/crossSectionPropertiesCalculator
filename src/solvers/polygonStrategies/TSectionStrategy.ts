import { SHAPE_TYPES } from "../../interfaces/beams/common.types";
import type { Geometry } from "../../interfaces/beams/common.types";
import type { TSectionGeometry } from "../../interfaces/beams/TSection.types";
import { buildArcPoints } from "../poligonUtils/buildArcPoints";
import { AbstractPolygonBuildStrategy } from "./AbstractPolygonBuildStrategy";

/**
 * T section: a vertical web with a flange on top. Local origin (0, 0) is the
 * bottom-left corner of the web, so the web is x 0..t_w and the flange sits at
 * y (h - t_f)..h, spanning x -b..(w - b). Both web/flange fillets use the same radius.
 * Points go clockwise and the last one repeats the first, like the other sections.
 */
export class TSectionStrategy extends AbstractPolygonBuildStrategy<TSectionGeometry> {
	test(geometry: Geometry) {
		return geometry.type === SHAPE_TYPES.T_SECTION;
	}

	execute(geometry: TSectionGeometry) {
		const { h, t_w, t_f, b, w } = geometry;

		// a fillet can never be bigger than the flange overhang on its side or the web height under the flange
		const overhangLeft = b;
		const overhangRight = w - b - t_w;
		const r = Math.max(0, Math.min(geometry.r, overhangLeft, overhangRight, h - t_f));

		const rSegments = AbstractPolygonBuildStrategy.remapRadiusToSegments(r);

		const polygon = [
			{ x: 0, y: 0 },
			// left side of the web, then the fillet into the underside of the flange
			...buildArcPoints(
				{ x: -r, y: h - t_f - r },
				r,
				0,
				Math.PI / 2,
				rSegments
			),
			{ x: -b, y: h - t_f },
			{ x: -b, y: h },
			{ x: w - b, y: h },
			{ x: w - b, y: h - t_f },
			// underside of the flange, then the fillet down the right side of the web
			...buildArcPoints(
				{ x: t_w + r, y: h - t_f - r },
				r,
				Math.PI / 2,
				Math.PI,
				rSegments
			),
			{ x: t_w, y: 0 },
			// the last point the same as 1st one
			{ x: 0, y: 0 },
		];
		return this._rotatePolygon(polygon, { x: 0, y: 0 }, geometry.rotation);
	}
}
