import { SHAPE_TYPES } from "@/shared/shapes/types/common.types";
import type { Geometry } from "@/shared/shapes/types/common.types";
import type { ISectionGeometry } from "@/shared/shapes/types/ISection.types";
import type { Point } from "@/shared/types/geometry";
import { calculateCrossSectionProperties } from "./greenTheoremCalculator";
import { AbstractPropertiesStrategy } from "./AbstractPropertiesStrategy";

export class ISectionPropertiesStrategy extends AbstractPropertiesStrategy<ISectionGeometry> {
	test(geometry: Geometry) {
		return geometry.type === SHAPE_TYPES.I_SECTION;
	}

	execute(_geometry: ISectionGeometry, polygon: Point[]) {
		return calculateCrossSectionProperties(polygon);
	}
}
