import { SHAPE_TYPES } from "../../interfaces/beams/common.types";
import type { Geometry } from "../../interfaces/beams/common.types";
import type { LSectionGeometry } from "../../interfaces/beams/LSection.types";
import type { Point } from "../../interfaces/common/types";
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
