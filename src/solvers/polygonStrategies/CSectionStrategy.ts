import { SHAPE_TYPES } from "../../interfaces/beams/common.types";
import type { Geometry } from "../../interfaces/beams/common.types";
import type { CSectionGeometry } from "../../interfaces/beams/CSection.types";
import { buildArcPoints } from "../poligonUtils/buildArcPoints";
import { AbstractPolygonBuildStrategy } from "./AbstractPolygonBuildStrategy";

export class CSectionStrategy extends AbstractPolygonBuildStrategy<CSectionGeometry> {
	test(geometry: Geometry) {
		return geometry.type === SHAPE_TYPES.C_SECTION;
	}

	execute(geometry: CSectionGeometry) {
		const {
			h, t_w, w2, t_f2, r2,
			w1, t_f1, r1
		} = geometry;

		const r1Segments = AbstractPolygonBuildStrategy.remapRadiusToSegments(r1);
		const r2Segments = AbstractPolygonBuildStrategy.remapRadiusToSegments(r2);

		const polygon = [
			{
				x: 0,
				y: 0,
			},
			{
				x: 0,
				y: h,
			},
			{
				x: w1,
				y: h,
			},
			{
				x: w1,
				y: h - t_f1,
			},

			...buildArcPoints(
				{
					x: t_w + r1,
					y: h - t_f1 - r1,
				},
				r1,
				Math.PI / 2,
				Math.PI,
				r1Segments
			),

			...buildArcPoints(
				{
					x: t_w + r2,
					y: t_f2 + r2,
				},
				r2,
				Math.PI,
				Math.PI * 1.5,
				r2Segments
			),
			{
				x: w2,
				y: t_f2,
			},
			{
				x: w2,
				y: 0
			},
			{
				x: 0,
				y: 0,
			},
		];
		return this._rotatePolygon(polygon, { x: 0, y: 0 }, geometry.rotation);
	}
}
