import { SHAPE_TYPES } from "../../interfaces/beams/common.types";
import type { Geometry } from "../../interfaces/beams/common.types";
import type { OSectionHollowGeometry } from "../../interfaces/beams/OSection.types";
import { buildArcPoints } from "../poligonUtils/buildArcPoints";
import { AbstractPolygonBuildStrategy } from "./AbstractPolygonBuildStrategy";

export class HollowTubeStrategy extends AbstractPolygonBuildStrategy<OSectionHollowGeometry> {
	test(geometry: Geometry) {
		return geometry.type === SHAPE_TYPES.HOLLOW_TUBE;
	}

	execute(geometry: OSectionHollowGeometry) {
		const { d1, d2 } = geometry;

		const rSegments = Math.min(d1, 40);
		const r2Segments = Math.min(d2, 40);

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
			...buildArcPoints(
				{
					x: 0,
					y: 0,
				},
				d2 / 2,
				0,
				Math.PI * 2,
				r2Segments
			),
		];
		return this._rotatePolygon(polygon, { x: 0, y: 0 }, geometry.rotation);
	}
}
