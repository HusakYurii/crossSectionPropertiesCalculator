import { SHAPE_TYPES } from "../../interfaces/beams/common.types";
import type { Geometry } from "../../interfaces/beams/common.types";
import type { RectangleGeometry } from "../../interfaces/beams/RectSection.types";
import type { Point } from "../../interfaces/common/types";
import { calculateCrossSectionProperties } from "./greenTheoremCalculator";
import { AbstractPropertiesStrategy } from "./AbstractPropertiesStrategy";

export class RectanglePropertiesStrategy extends AbstractPropertiesStrategy<RectangleGeometry> {
	test(geometry: Geometry) {
		return geometry.type === SHAPE_TYPES.RECTANGLE;
	}

	execute(_geometry: RectangleGeometry, polygon: Point[]) {
		return calculateCrossSectionProperties(polygon);
	}
}
