import { SHAPE_TYPES } from "@/shared/shapes/types/common.types";
import type { Geometry } from "@/shared/shapes/types/common.types";
import type { TSectionGeometry } from "@/shared/shapes/types/TSection.types";
import type { Point } from "@/shared/types/geometry";
import { calculateCrossSectionProperties } from "./greenTheoremCalculator";
import { AbstractPropertiesStrategy } from "./AbstractPropertiesStrategy";

export class TSectionPropertiesStrategy extends AbstractPropertiesStrategy<TSectionGeometry> {
	test(geometry: Geometry) {
		return geometry.type === SHAPE_TYPES.T_SECTION;
	}

	execute(_geometry: TSectionGeometry, polygon: Point[]) {
		return calculateCrossSectionProperties(polygon);
	}
}
