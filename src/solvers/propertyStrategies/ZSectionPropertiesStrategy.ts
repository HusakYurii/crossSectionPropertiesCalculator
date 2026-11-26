import { SHAPE_TYPES } from "@/shared/shapes/types/common.types";
import type { Geometry } from "@/shared/shapes/types/common.types";
import type { ZSectionGeometry } from "@/shared/shapes/types/ZSection.types";
import type { Point } from "@/shared/types/geometry";
import { calculateCrossSectionProperties } from "./greenTheoremCalculator";
import { AbstractPropertiesStrategy } from "./AbstractPropertiesStrategy";

export class ZSectionPropertiesStrategy extends AbstractPropertiesStrategy<ZSectionGeometry> {
	test(geometry: Geometry) {
		return geometry.type === SHAPE_TYPES.Z_SECTION;
	}

	execute(_geometry: ZSectionGeometry, polygon: Point[]) {
		return calculateCrossSectionProperties(polygon);
	}
}
