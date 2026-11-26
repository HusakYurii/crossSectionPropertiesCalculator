import { SHAPE_TYPES } from "@/shared/shapes/types/common.types";
import type { Geometry } from "@/shared/shapes/types/common.types";
import type { LSectionGeometry } from "@/shared/shapes/types/LSection.types";
import { buildArcPoints } from "../polygon/buildArcPoints";
import { AbstractPolygonBuildStrategy } from "./AbstractPolygonBuildStrategy";

export class LSectionStrategy extends AbstractPolygonBuildStrategy<LSectionGeometry> {
	test(geometry: Geometry) {
		return geometry.type === SHAPE_TYPES.L_SECTION;
	}

	execute(geometry: LSectionGeometry) {
		const {
			h, t_f1, w, t_f2, r
		} = geometry;

		const rSegments = AbstractPolygonBuildStrategy.remapRadiusToSegments(r);

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
				x: t_f1,
				y: h,
			},

			...buildArcPoints(
				{
					x: t_f1 + r,
					y: t_f2 + r,
				},
				r,
				Math.PI,
				Math.PI * 1.5,
				rSegments
			),
			{
				x: w,
				y: t_f2,
			},
			{
				x: w,
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
