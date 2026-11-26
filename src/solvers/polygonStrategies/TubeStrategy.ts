import { SHAPE_TYPES } from "@/shared/shapes/types/common.types";
import type { Geometry } from "@/shared/shapes/types/common.types";
import type { OSectionGeometry } from "@/shared/shapes/types/OSection.types";
import { buildArcPoints } from "../polygon/buildArcPoints";
import { AbstractPolygonBuildStrategy } from "./AbstractPolygonBuildStrategy";

export class TubeStrategy extends AbstractPolygonBuildStrategy<OSectionGeometry> {
	test(geometry: Geometry) {
		return geometry.type === SHAPE_TYPES.TUBE;
	}

	execute(geometry: OSectionGeometry) {
		const { d1 } = geometry;

		const rSegments = Math.min(d1, 40);

		const polygon = [
			...buildArcPoints(
				{
					x: 0,
					y: 0,
				},
				d1 / 2,
				0,
				Math.PI * 2,
				rSegments
			),
		];
		return this._rotatePolygon(polygon, { x: 0, y: 0 }, geometry.rotation);
	}
}
