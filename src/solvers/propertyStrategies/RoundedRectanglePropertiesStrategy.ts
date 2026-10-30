import { SHAPE_TYPES } from "../../interfaces/beams/common.types";
import type { Geometry } from "../../interfaces/beams/common.types";
import type { RoundedRectangleGeometry } from "../../interfaces/beams/RectSection.types";
import type { Point } from "../../interfaces/common/types";
import { calculateCrossSectionProperties } from "./greenTheoremCalculator";
import { AbstractPropertiesStrategy } from "./AbstractPropertiesStrategy";

export class RoundedRectanglePropertiesStrategy extends AbstractPropertiesStrategy<RoundedRectangleGeometry> {
	test(geometry: Geometry) {
		return geometry.type === SHAPE_TYPES.ROUNDED_RECTANGLE;
	}

	execute(geometry: RoundedRectangleGeometry, polygon: Point[]) {
		return calculateCrossSectionProperties(polygon);
	}
}
