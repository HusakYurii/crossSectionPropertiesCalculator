import { SHAPE_TYPES } from "../../interfaces/beams/common.types";
import type { Geometry } from "../../interfaces/beams/common.types";
import type { RectangleGeometry } from "../../interfaces/beams/RectSection.types";
import { AbstractPolygonBuildStrategy } from "./AbstractPolygonBuildStrategy";

export class RectangleStrategy extends AbstractPolygonBuildStrategy<RectangleGeometry> {
	test(geometry: Geometry) {
		return geometry.type === SHAPE_TYPES.RECTANGLE;
	}

	execute(geometry: RectangleGeometry) {
		const { w, h } = geometry;
		const hW = w / 2;
		const hH = h / 2;

		const polygon = [
			{ x: -hW, y: -hH },
			{ x: -hW, y: hH },
			{ x: hW, y: hH },
			{ x: hW, y: -hH },
			{ x: -hW, y: -hH },
		];
		return this._rotatePolygon(polygon, { x: 0, y: 0 }, geometry.rotation);
	}
}
