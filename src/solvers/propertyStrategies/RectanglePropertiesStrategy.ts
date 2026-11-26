import { SHAPE_TYPES } from "@/shared/shapes/types/common.types";
import type { Geometry } from "@/shared/shapes/types/common.types";
import type { RectangleGeometry } from "@/shared/shapes/types/RectSection.types";
import type { Point } from "@/shared/types/geometry";
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
