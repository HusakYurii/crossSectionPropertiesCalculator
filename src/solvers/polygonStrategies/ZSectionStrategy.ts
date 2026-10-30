import { SHAPE_TYPES } from "../../interfaces/beams/common.types";
import type { Geometry } from "../../interfaces/beams/common.types";
import type { ZSectionGeometry } from "../../interfaces/beams/ZSection.types";
import { buildArcPoints } from "../poligonUtils/buildArcPoints";
import { AbstractPolygonBuildStrategy } from "./AbstractPolygonBuildStrategy";

export class ZSectionStrategy extends AbstractPolygonBuildStrategy<ZSectionGeometry> {
	test(geometry: Geometry) {
		return geometry.type === SHAPE_TYPES.Z_SECTION;
	}

	execute(geometry: ZSectionGeometry) {
		const {
			h, t_f1, w1, r1,
			t_w, r2, t_f2, w2
		} = geometry;

		const r1Segments = AbstractPolygonBuildStrategy.remapRadiusToSegments(r1);
		const r2Segments = AbstractPolygonBuildStrategy.remapRadiusToSegments(r2);

		const polygon = [
			{
				x: 0,
				y: 0,
			},

			...buildArcPoints(
				{
					x: -r1,
					y: h - t_f1 - r1,
				},
				r1,
				0,
				Math.PI / 2,
				r1Segments
			),
			{
				x: -(w1 - t_w),
				y: h - t_f1,
			},
			{
				x: -(w1 - t_w),
				y: h
			},
			{
				x: t_w,
				y: h
			},

			...buildArcPoints(
				{
					x: t_w + r2,
					y: t_f2 + r2
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
				y: 0,
			},
			{
				x: 0,
				y: 0,
			},
		];
		return this._rotatePolygon(polygon, { x: 0, y: 0 }, geometry.rotation);
	}
}
