import { SHAPE_TYPES } from "../../interfaces/beams/common.types";
import type { Geometry } from "../../interfaces/beams/common.types";
import type { CustomShapeGeometry } from "../../interfaces/beams/CustomShape.types";
import { AbstractPolygonBuildStrategy } from "./AbstractPolygonBuildStrategy";

const MIN_POINTS = 3;

/**
 * User drawn polygon. The points are used as they are and the polygon is closed by repeating the
 * first point at the end, like the other strategies. Fewer than 3 points is not a shape, so it
 * gives an empty polygon.
 */
export class CustomShapeStrategy extends AbstractPolygonBuildStrategy<CustomShapeGeometry> {
	test(geometry: Geometry) {
		return geometry.type === SHAPE_TYPES.CUSTOM_SHAPE;
	}

	execute(geometry: CustomShapeGeometry) {
		const points = (geometry.points ?? []).map(({ x, y }) => ({ x, y }));

		if (points.length < MIN_POINTS) {
			return [];
		}

		const polygon = [...points, { ...points[0] }];
		return this._rotatePolygon(polygon, { x: 0, y: 0 }, geometry.rotation);
	}
}
