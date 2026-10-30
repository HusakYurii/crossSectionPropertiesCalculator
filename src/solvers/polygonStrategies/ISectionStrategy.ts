import { SHAPE_TYPES } from "../../interfaces/beams/common.types";
import type { Geometry } from "../../interfaces/beams/common.types";
import type { ISectionGeometry } from "../../interfaces/beams/ISection.types";
import { buildArcPoints } from "../poligonUtils/buildArcPoints";
import { AbstractPolygonBuildStrategy } from "./AbstractPolygonBuildStrategy";

export class ISectionStrategy extends AbstractPolygonBuildStrategy<ISectionGeometry> {
	test(geometry: Geometry) {
		return geometry.type === SHAPE_TYPES.I_SECTION;
	}

	execute(geometry: ISectionGeometry) {
		const {
			h, t_f1, w1, b1, r1,
			t_f2, w2, b2, r2, t_w
		} = geometry;

		const r1Segments = AbstractPolygonBuildStrategy.remapRadiusToSegments(r1);
		const r2Segments = AbstractPolygonBuildStrategy.remapRadiusToSegments(r2);

		const polygon = [
			{
				x: 0,
				y: 0
			},
			{
				x: 0,
				y: t_f2
			},

			...buildArcPoints(
				{
					x: b2 - r2,
					y: t_f2 + r2
				},
				r2,
				-Math.PI / 2,
				0,
				r2Segments
			),

			...buildArcPoints(
				{
					x: b2 - r1,
					y: h - t_f1 - r1
				},
				r1,
				0,
				Math.PI / 2,
				r1Segments
			),
			{
				x: b2 - b1,
				y: h - t_f1
			},
			{
				x: b2 - b1,
				y: h
			},
			{
				x: b2 - b1 + w1,
				y: h
			},
			{
				x: b2 - b1 + w1,
				y: h - t_f1
			},

			...buildArcPoints(
				{
					x: b2 + t_w + r1,
					y: h - t_f1 - r1
				},
				r1,
				Math.PI / 2,
				Math.PI,
				r1Segments
			),

			...buildArcPoints(
				{
					x: b2 + t_w + r2,
					y: t_f2 + r2
				},
				r2,
				Math.PI,
				Math.PI * 1.5,
				r2Segments
			),
			{
				x: w2,
				y: t_f2
			},
			{
				x: w2,
				y: 0
			},
			// the last point the same as 1st one
			{
				x: 0,
				y: 0
			},
		];
		return this._rotatePolygon(polygon, { x: 0, y: 0 }, geometry.rotation);
	}
}
