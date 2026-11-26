import { SHAPE_TYPES } from "@/shared/shapes/types/common.types";
import type { Geometry } from "@/shared/shapes/types/common.types";
import type { RoundedRectangleGeometry } from "@/shared/shapes/types/RectSection.types";
import type { Point } from "@/shared/types/geometry";
import { calculateCrossSectionProperties } from "./greenTheoremCalculator";
import { AbstractPropertiesStrategy } from "./AbstractPropertiesStrategy";

export class RoundedRectanglePropertiesStrategy extends AbstractPropertiesStrategy<RoundedRectangleGeometry> {
	test(geometry: Geometry) {
		return geometry.type === SHAPE_TYPES.ROUNDED_RECTANGLE;
	}

	execute(_geometry: RoundedRectangleGeometry, polygon: Point[]) {
		return calculateCrossSectionProperties(polygon);
	}
}
