import { SHAPE_TYPES } from "@/shared/shapes/types/common.types";
import type { Geometry } from "@/shared/shapes/types/common.types";
import type { CSectionGeometry } from "@/shared/shapes/types/CSection.types";
import type { Point } from "@/shared/types/geometry";
import { calculateCrossSectionProperties } from "./greenTheoremCalculator";
import { AbstractPropertiesStrategy } from "./AbstractPropertiesStrategy";

export class CSectionPropertiesStrategy extends AbstractPropertiesStrategy<CSectionGeometry> {
	test(geometry: Geometry) {
		return geometry.type === SHAPE_TYPES.C_SECTION;
	}

	execute(_geometry: CSectionGeometry, polygon: Point[]) {
		return calculateCrossSectionProperties(polygon);
	}
}
