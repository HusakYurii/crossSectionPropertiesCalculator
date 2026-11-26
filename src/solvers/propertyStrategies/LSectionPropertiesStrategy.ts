import { SHAPE_TYPES } from "@/shared/shapes/types/common.types";
import type { Geometry } from "@/shared/shapes/types/common.types";
import type { LSectionGeometry } from "@/shared/shapes/types/LSection.types";
import type { Point } from "@/shared/types/geometry";
import { calculateCrossSectionProperties } from "./greenTheoremCalculator";
import { AbstractPropertiesStrategy } from "./AbstractPropertiesStrategy";

export class LSectionPropertiesStrategy extends AbstractPropertiesStrategy<LSectionGeometry> {
	test(geometry: Geometry) {
		return geometry.type === SHAPE_TYPES.L_SECTION;
	}

	execute(_geometry: LSectionGeometry, polygon: Point[]) {
		return calculateCrossSectionProperties(polygon);
	}
}
