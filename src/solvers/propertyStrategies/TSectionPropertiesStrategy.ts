import { SHAPE_TYPES } from "../../interfaces/beams/common.types";
import type { Geometry } from "../../interfaces/beams/common.types";
import type { TSectionGeometry } from "../../interfaces/beams/TSection.types";
import type { Point } from "../../interfaces/common/types";
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
